/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Source } from '@hexabot-ai/types';
import {
  BadRequestException,
  Injectable,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';
import z from 'zod';

import { RuntimeSettingsService } from '@/setting/services/runtime-settings.service';
import { UpdateOneOptions } from '@/utils/generics/base-orm.repository';
import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { SourceCreateDto, SourceUpdateDto } from '../dto/source.dto';
import { SourceOrmEntity } from '../entities/source.entity';
import { SourceRepository } from '../repositories/source.repository';

@Injectable()
export class SourceService extends BaseOrmService<SourceOrmEntity> {
  constructor(
    repository: SourceRepository,
    private readonly runtimeSettingsService: RuntimeSettingsService,
    private readonly workflowService: WorkflowService,
  ) {
    super(repository);
  }

  private ensureSettingsObject(
    settings: unknown,
    channel: string,
  ): Record<string, unknown> {
    if (settings === undefined || settings === null) {
      return {};
    }

    if (typeof settings !== 'object' || Array.isArray(settings)) {
      throw new BadRequestException(
        `Source settings for channel "${channel}" must be a JSON object`,
      );
    }

    return settings as Record<string, unknown>;
  }

  private resolveChannelSchema(channel: string): z.ZodTypeAny | null {
    try {
      const definition = this.runtimeSettingsService.get(channel);

      if (definition.extensionType && definition.extensionType !== 'channel') {
        return null;
      }

      return definition.schema;
    } catch {
      return null;
    }
  }

  normalizeSettings(
    channel: string,
    settings: unknown,
  ): Record<string, unknown> {
    const rawSettings = this.ensureSettingsObject(settings, channel);
    const schema = this.resolveChannelSchema(channel);

    if (!schema) {
      return rawSettings;
    }

    const parsed = schema.safeParse(rawSettings);

    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid source settings for channel "${channel}"`,
      );
    }

    if (
      typeof parsed.data !== 'object' ||
      parsed.data === null ||
      Array.isArray(parsed.data)
    ) {
      throw new BadRequestException(
        `Source settings for channel "${channel}" must resolve to a JSON object`,
      );
    }

    return parsed.data as Record<string, unknown>;
  }

  private async normalizeDefaultWorkflow(
    defaultWorkflow: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (defaultWorkflow === undefined || defaultWorkflow === null) {
      return defaultWorkflow;
    }

    const workflow = await this.workflowService.findOne(defaultWorkflow);

    if (!workflow) {
      throw new NotFoundException(
        `Workflow with ID ${defaultWorkflow} not found`,
      );
    }

    return defaultWorkflow;
  }

  private async buildCreatePayload(
    payload: SourceCreateDto,
  ): Promise<SourceCreateDto> {
    const normalizedSettings = this.normalizeSettings(
      payload.channel,
      payload.settings,
    );
    const defaultWorkflow = await this.normalizeDefaultWorkflow(
      payload.defaultWorkflow,
    );

    return {
      ...payload,
      settings: normalizedSettings,
      state: payload.state ?? true,
      defaultWorkflow: defaultWorkflow ?? null,
    };
  }

  override async create(payload: SourceCreateDto): Promise<Source> {
    return await super.create(await this.buildCreatePayload(payload));
  }

  override async updateOne(
    idOrOptions: string | FindOneOptions<SourceOrmEntity>,
    payload: SourceUpdateDto,
    options?: UpdateOneOptions,
  ): Promise<Source> {
    const existing = await this.findOne(idOrOptions);

    if (!existing) {
      throw new NotFoundException('Source not found');
    }

    const channel = payload.channel ?? existing.channel;
    const shouldResetSettings =
      payload.channel !== undefined && payload.settings === undefined;
    const settingsInput = shouldResetSettings
      ? {}
      : (payload.settings ?? existing.settings);
    const normalizedSettings = this.normalizeSettings(channel, settingsInput);
    const normalizedDefaultWorkflow =
      payload.defaultWorkflow !== undefined
        ? await this.normalizeDefaultWorkflow(payload.defaultWorkflow)
        : undefined;

    return await super.updateOne(
      idOrOptions,
      {
        ...payload,
        channel,
        settings: normalizedSettings,
        ...(normalizedDefaultWorkflow !== undefined
          ? { defaultWorkflow: normalizedDefaultWorkflow }
          : {}),
      },
      options,
    );
  }

  async findActiveByRef(sourceRef: string): Promise<Source> {
    const normalizedSourceRef = sourceRef.trim();
    const source = await this.findOne(normalizedSourceRef);

    if (!source || !source.state) {
      throw new NotFoundException(`Source with ID ${sourceRef} not found`);
    }

    return source;
  }

  async findActiveById(sourceId: string): Promise<Source> {
    return await this.findActiveByRef(sourceId);
  }

  override async deleteOne(
    _idOrOptions: string | FindOneOptions<SourceOrmEntity>,
  ): Promise<DeleteResult> {
    throw new MethodNotAllowedException(
      'Sources cannot be deleted. Disable the source instead.',
    );
  }

  override async deleteMany(
    _options?: FindManyOptions<SourceOrmEntity>,
  ): Promise<DeleteResult> {
    throw new MethodNotAllowedException(
      'Sources cannot be deleted. Disable the source instead.',
    );
  }

  async ensureDefaultSources(channelNames: string[]): Promise<void> {
    for (const channelName of channelNames) {
      const existing = await this.findOne({
        where: { channel: channelName },
      });

      if (existing) {
        continue;
      }

      await this.create({
        name: `default-${channelName}`,
        channel: channelName,
        settings: {},
        state: true,
        defaultWorkflow: null,
      });
    }
  }
}
