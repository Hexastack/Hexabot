/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BadRequestException,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { LoggerService } from '@/logger/logger.service';
import { GLOBAL_SETTINGS_GROUP } from '@/setting/default.settings';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { MetadataService } from '@/setting/services/metadata.service';
import { SettingService } from '@/setting/services/setting.service';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { UpdateEntityEvent } from '@/utils/types/entity-event.types';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';

import {
  LemonSqueezyActivationResponse,
  LemonSqueezyLicenseKey,
  LemonSqueezyMeta,
  LemonSqueezyValidationResponse,
} from '../types/lemon-squeezy.types';
import {
  ALL_LICENSE_FEATURES,
  FEATURE_MIN_PLAN,
  LICENSE_PLAN_RANK,
  LicenseFeature,
  LicensePlan,
  LicenseSnapshot,
  LicenseStatus,
  PaidPlan,
} from '../types/license-feature.enum';
import {
  LICENSE_QUOTA_LIMITS,
  LicenseQuotaResource,
  LicenseQuotaSnapshot,
  resolveLicenseQuotaTier,
} from '../types/license-quota';

import { LemonSqueezyService } from './lemon-squeezy.service';

const INSTANCE_ID_METADATA_KEY = 'instance_id';

type RefreshSource = 'bootstrap' | 'setting';

@Injectable()
export class LicenseService implements OnApplicationBootstrap {
  private readonly features = new Map<LicenseFeature, boolean>();

  private status: LicenseStatus = 'inactive';

  private plan: LicensePlan = 'unknown';

  private lastError: string | null = null;

  private activationLimit: number | null = null;

  private activationUsage: number | null = null;

  constructor(
    private readonly apiService: LemonSqueezyService,
    private readonly settingService: SettingService,
    private readonly metadataService: MetadataService,
    private readonly logger: LoggerService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.disableAllFeatures();
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.refresh('bootstrap');
  }

  hasFeature(feature: LicenseFeature): boolean {
    return this.features.get(feature) === true;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  getStatus(): LicenseStatus {
    return this.status;
  }

  getPlan(): LicensePlan {
    return this.plan;
  }

  getActivationLimit(): number | null {
    return this.activationLimit;
  }

  getActivationUsage(): number | null {
    return this.activationUsage;
  }

  async getSnapshot(): Promise<LicenseSnapshot> {
    const quotas = await this.buildQuotaSnapshot();

    return {
      status: this.status,
      plan: this.plan,
      activationLimit: this.activationLimit,
      activationUsage: this.activationUsage,
      lastError: this.lastError,
      quotas,
    };
  }

  private async buildQuotaSnapshot(): Promise<LicenseQuotaSnapshot> {
    const tier = resolveLicenseQuotaTier(this.status, this.plan);
    const [usersCount, workflowsCount] = await Promise.all([
      this.dataSource.getRepository(UserOrmEntity).count(),
      this.dataSource.getRepository(WorkflowOrmEntity).count(),
    ]);
    const counts: Record<LicenseQuotaResource, number> = {
      users: usersCount,
      workflows: workflowsCount,
    };
    const resources = Object.entries(LICENSE_QUOTA_LIMITS).reduce(
      (acc, [resource, limits]) => {
        const typedResource = resource as LicenseQuotaResource;
        const used = counts[typedResource];
        const limit = limits[tier];
        const remaining =
          typeof limit === 'number' ? Math.max(limit - used, 0) : null;

        acc[typedResource] = {
          limit,
          used,
          remaining,
          reached: typeof limit === 'number' ? used >= limit : false,
        };

        return acc;
      },
      {} as LicenseQuotaSnapshot['resources'],
    );

    return {
      tier,
      resources,
    };
  }

  async refresh(source: RefreshSource = 'bootstrap'): Promise<void> {
    try {
      const key = await this.getLicenseKey();
      if (!key) {
        this.applyInactiveState(
          'undefined',
          'unknown',
          source === 'bootstrap'
            ? 'No license key set (bootstrap).'
            : 'No license key set.',
        );

        return;
      }

      const instanceId = await this.getInstanceId();
      const validated = await this.apiService.validate(key, instanceId);

      if (!validated.valid || !validated.license_key) {
        this.applyInactiveState(
          'invalid',
          'unknown',
          source === 'bootstrap'
            ? 'Invalid license key (bootstrap).'
            : 'Invalid license key.',
        );

        return;
      }

      const licenseKey = validated.license_key;
      const currentPlan = this.inferPlan(validated.meta);

      if (licenseKey.status === 'expired' || licenseKey.status === 'disabled') {
        this.applyInactiveState(
          licenseKey.status,
          currentPlan,
          source === 'bootstrap'
            ? `License key ${licenseKey.status} (bootstrap).`
            : `License key ${licenseKey.status}.`,
        );

        return;
      }

      if (licenseKey.status !== 'active' && licenseKey.status !== 'inactive') {
        this.applyInactiveState(
          'inactive',
          currentPlan,
          `License key status \"${licenseKey.status}\" is not activatable.`,
        );

        return;
      }

      if (licenseKey.status === 'active' && validated.instance?.id) {
        await this.applyActivatedState(validated, source);

        return;
      }

      if (!this.hasAvailableActivationSlot(licenseKey)) {
        this.applyInactiveState(
          'inactive',
          currentPlan,
          source === 'bootstrap'
            ? `Activation limit reached during bootstrap (usage=${licenseKey.activation_usage ?? 'n/a'}/${licenseKey.activation_limit ?? 'n/a'}).`
            : `Activation limit reached (usage=${licenseKey.activation_usage ?? 'n/a'}/${licenseKey.activation_limit ?? 'n/a'}).`,
        );

        return;
      }

      const activated = await this.apiService.activate(licenseKey.key);

      if (!activated.activated) {
        this.applyInactiveState(
          'inactive',
          currentPlan,
          activated.error ||
            `Unable to activate license (status=${activated.license_key?.status ?? 'unknown'}).`,
        );

        return;
      }

      await this.applyActivatedState(activated, source);
    } catch (err) {
      const msg = this.apiService.extractAxiosError(err);
      this.applyInactiveState(
        'error',
        'unknown',
        `${source === 'bootstrap' ? 'Bootstrap' : 'Refresh'} failed: ${msg}`,
      );
    }
  }

  @OnEvent('hook:setting:preUpdate')
  async handleLicenseKeyUpdate(event: UpdateEntityEvent<SettingOrmEntity>) {
    const previous = event.databaseEntity;
    const next = event.entity as SettingOrmEntity | undefined;
    const group = next?.group ?? previous?.group;
    const label = next?.label ?? previous?.label;

    if (group !== GLOBAL_SETTINGS_GROUP || label !== 'license_key') {
      return;
    }

    const oldKey = this.normalizeLicenseKey(previous?.value);
    const newKey = this.normalizeLicenseKey(next?.value);

    if (newKey === oldKey) {
      await this.refresh('setting');

      return;
    }

    if (!newKey) {
      const isSuccess = oldKey
        ? await this.deactivate(oldKey, 'License key removed.')
        : true;

      if (!isSuccess) {
        throw new BadRequestException('Failed to remove existing license key.');
      }

      this.applyInactiveState('undefined', 'unknown', 'No license key set.');

      return;
    }

    let validLicense: LemonSqueezyValidationResponse;

    try {
      validLicense = await this.validateCandidateLicense(newKey);
    } catch (err) {
      // When there is no previously stored key, reflect the validation failure
      // in runtime snapshot state so UI/guards don't keep stale bootstrap errors.
      if (!oldKey) {
        if (err instanceof BadRequestException) {
          this.applyInactiveState(
            'invalid',
            'unknown',
            this.extractBadRequestMessage(err, 'Invalid license key.'),
          );
        } else {
          this.applyInactiveState(
            'error',
            'unknown',
            `Unable to validate the license key - ${this.apiService.extractAxiosError(err)}`,
          );
        }
      } else {
        await this.refresh('setting');
      }

      throw err;
    }

    const newLicenseKey = validLicense.license_key!;

    if (oldKey) {
      const deactivated = await this.deactivate(oldKey, 'License will rotate.');

      if (!deactivated) {
        throw new BadRequestException(
          'Failed to deactivate existing license key before rotation.',
        );
      }
    }

    let activation: LemonSqueezyActivationResponse;
    try {
      activation = await this.apiService.activate(newLicenseKey.key);
    } catch (err) {
      await this.restoreOldLicense(oldKey);

      throw new BadRequestException(
        `Unable to activate the license key - ${this.apiService.extractAxiosError(err)}`,
      );
    }

    if (!activation.activated) {
      await this.restoreOldLicense(oldKey);

      throw new BadRequestException(
        activation.error ||
          'Unable to activate the license key, please try again later or contact support.',
      );
    }

    await this.applyActivatedState(activation, 'setting');
  }

  async deactivate(licenseKey: string, reason?: string): Promise<boolean> {
    try {
      const instanceId = await this.getInstanceId();
      const validated = await this.apiService.validate(licenseKey, instanceId);

      if (!validated.valid) {
        this.logger.warn('Cannot deactivate invalid license key', validated);
        this.applyInactiveState('error', 'unknown', reason);

        return true;
      }

      const currentPlan = this.inferPlan(validated.meta);
      if (validated.license_key?.status === 'active' && instanceId) {
        const result = await this.apiService.deactivate(licenseKey, instanceId);

        if (!result.deactivated) {
          throw new Error(result.error || 'Failed to deactivate license key.');
        }

        await this.removeInstanceId();
        this.logger.debug('License key successfully deactivated');
        this.applyInactiveState('inactive', currentPlan, reason);
      } else {
        this.logger.warn('Cannot deactivate license key', validated);
        this.applyInactiveState('inactive', currentPlan, reason);
      }

      return true;
    } catch (err) {
      this.logger.error('Unable to deactivate license key', err);

      return false;
    }
  }

  private async validateCandidateLicense(
    licenseKey: string,
  ): Promise<LemonSqueezyValidationResponse> {
    let validation: LemonSqueezyValidationResponse;

    try {
      validation = await this.apiService.validate(licenseKey);
    } catch (err) {
      throw new BadRequestException(
        `New license key validation failed - ${this.apiService.extractAxiosError(err)}`,
      );
    }

    if (!validation.valid || !validation.license_key) {
      throw new BadRequestException('Invalid license key.');
    }

    if (validation.license_key.status === 'expired') {
      throw new BadRequestException(
        'License key has expired, please renew your subscription and try again.',
      );
    }

    if (validation.license_key.status === 'disabled') {
      throw new BadRequestException('License key has been disabled.');
    }

    if (
      validation.license_key.status !== 'active' &&
      validation.license_key.status !== 'inactive'
    ) {
      throw new BadRequestException(
        `Unsupported license key status \"${validation.license_key.status}\".`,
      );
    }

    if (!this.hasAvailableActivationSlot(validation.license_key)) {
      throw new BadRequestException('License key activation limit reached.');
    }

    return validation;
  }

  private extractBadRequestMessage(
    error: BadRequestException,
    fallback: string,
  ): string {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const message = (response as { message?: string | string[] }).message;

      if (Array.isArray(message)) {
        return message.filter(Boolean).join(', ') || fallback;
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }

  private async restoreOldLicense(oldKey?: string): Promise<void> {
    if (!oldKey) {
      return;
    }

    try {
      const restored = await this.apiService.activate(oldKey);

      if (restored.activated) {
        await this.applyActivatedState(restored, 'setting');
      } else {
        this.logger.warn(
          'Unable to restore previous license key after failure',
        );
      }
    } catch (err) {
      this.logger.error('Unable to restore previous license key', err);
    }
  }

  private async getLicenseKey(): Promise<string | undefined> {
    await this.settingService.clearCache();
    const settings = await this.settingService.getSettings();

    return this.normalizeLicenseKey(settings.global_settings?.license_key);
  }

  private async getInstanceId(): Promise<string | undefined> {
    const metadata = await this.metadataService.findOne({
      where: { name: INSTANCE_ID_METADATA_KEY },
    });

    return this.normalizeLicenseKey(metadata?.value);
  }

  private async removeInstanceId() {
    return await this.metadataService.deleteOne({
      where: { name: INSTANCE_ID_METADATA_KEY },
    });
  }

  private async upsertInstanceId(instanceId: string) {
    return await this.metadataService.updateOne(
      { where: { name: INSTANCE_ID_METADATA_KEY } },
      { name: INSTANCE_ID_METADATA_KEY, value: instanceId },
    );
  }

  private normalizeLicenseKey(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : undefined;
  }

  private disableAllFeatures() {
    ALL_LICENSE_FEATURES.forEach((feature) =>
      this.features.set(feature, false),
    );
  }

  private syncFeatureState() {
    if (this.status !== 'active') {
      this.disableAllFeatures();

      return;
    }

    ALL_LICENSE_FEATURES.forEach((feature) => {
      const minPlan = FEATURE_MIN_PLAN[feature];
      this.features.set(feature, this.planSatisfies(this.plan, minPlan));
    });
  }

  private planSatisfies(current: LicensePlan, minimum: PaidPlan): boolean {
    return LICENSE_PLAN_RANK[current] >= LICENSE_PLAN_RANK[minimum];
  }

  private hasAvailableActivationSlot(licenseKey: LemonSqueezyLicenseKey) {
    const limit = licenseKey.activation_limit ?? 0;
    const usage = licenseKey.activation_usage ?? 0;

    if (limit <= 0) {
      return true;
    }

    return usage < limit;
  }

  private async applyActivatedState(
    response: LemonSqueezyActivationResponse | LemonSqueezyValidationResponse,
    source: RefreshSource,
  ): Promise<void> {
    const instanceId = this.normalizeLicenseKey(response.instance?.id);

    if (instanceId) {
      await this.upsertInstanceId(instanceId);
    } else {
      this.logger.warn(
        'Lemon Squeezy response has no instance id while activating license',
      );
    }

    this.status = 'active';
    this.updateUsageAndPlan(response, response.meta ?? null);
    this.clearError();
    this.syncFeatureState();
    this.logger.verbose(
      `License active (source=${source}, plan=${this.plan}, usage=${this.activationUsage ?? 'n/a'}/${this.activationLimit ?? 'n/a'}).`,
    );
  }

  private updateUsageAndPlan(
    response: LemonSqueezyActivationResponse | LemonSqueezyValidationResponse,
    meta: LemonSqueezyMeta | null,
  ): void {
    this.activationLimit = response.license_key?.activation_limit ?? null;
    this.activationUsage = response.license_key?.activation_usage ?? null;
    this.plan = this.inferPlan(meta);
  }

  private applyInactiveState(
    status: LicenseStatus = 'inactive',
    plan: LicensePlan = 'unknown',
    reason?: string,
  ): void {
    this.status = status;
    this.plan = plan;
    this.activationLimit = null;
    this.activationUsage = null;
    this.syncFeatureState();

    if (reason) {
      this.setError(reason);
    } else {
      this.clearError();
    }
  }

  private clearError() {
    this.lastError = null;
  }

  private setError(message: string) {
    this.lastError = message;
    this.logger.warn(message);
  }

  private inferPlan(meta: LemonSqueezyMeta | null | undefined): LicensePlan {
    const name = meta?.product_name?.toLowerCase();

    if (name?.includes('starter')) {
      return 'starter';
    }

    if (name?.includes('pro')) {
      return 'pro';
    }

    if (name?.includes('unlimited')) {
      return 'unlimited';
    }

    return 'unknown';
  }
}
