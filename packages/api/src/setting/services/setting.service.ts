/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { config } from '@/config';
import { Config } from '@/config/types';
import {
  ALLOWED_ORIGINS_CACHE_KEY,
  SETTING_CACHE_KEY,
} from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  Setting,
  SettingCreateDto,
  SettingDtoConfig,
} from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import { SettingSeeder } from '../seeds/setting.seed';
import { BUILTIN_SETTING_GROUPS } from '../utils/builtin-setting-groups';
import { withSettingDefault } from '../utils/setting-schema-definition.utils';
import {
  SettingSchemaCatalogEntry,
  buildSettingGroupJsonSchema,
  buildSettingGroupValues,
  buildSettingGroupZodSchema,
  mergeSettingGroupSources,
} from '../utils/setting-schema.utils';

@Injectable()
export class SettingService extends BaseOrmService<
  SettingOrmEntity,
  SettingDtoConfig
> {
  constructor(
    repository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly seeder: SettingSeeder,
  ) {
    super(repository);
  }

  /**
   * Synchronizes settings for the provided group by creating any missing rows.
   *
   * Existing values are preserved.
   *
   * @param _group - The logical group name requested by the caller.
   * @param data - The array of settings definitions to sync.
   */
  async seedIfNotExist(
    _group: string,
    data: SettingCreateDto[],
  ): Promise<void> {
    await this.seeder.seed(data);
  }

  /**
   * Loads all settings and returns them grouped in ascending order by weight.
   *
   * @returns A grouped object of settings.
   */
  async load(): Promise<Record<string, Setting[]>> {
    const settings = await this.findAll({
      order: { weight: 'ASC' },
    });

    return this.group(settings);
  }

  /**
   * Builds a tree structure from the settings array.
   *
   * Each setting is grouped by its `group` and returned as a structured object.
   *
   * @param settings - An array of settings to build into a tree structure.
   *
   * @returns A `Settings` object organized by group.
   */
  public buildTree(settings: Setting[]): Settings {
    return settings.reduce((acc: Settings, setting: Setting) => {
      const groupKey = setting.group || 'undefinedGroup';

      acc[groupKey] = acc[groupKey] || {};
      acc[groupKey][setting.label] = setting.value;

      return acc;
    }, {} as Settings);
  }

  /**
   * Groups the settings into a record where the key is the setting group and
   * the value is an array of settings in that group.
   *
   * @param settings - An array of settings to group.
   *
   * @returns A record where each key is a group and each value is an array of settings.
   */
  public group(settings: Setting[]): Record<string, Setting[]> {
    return settings.reduce(
      (acc, curr) => {
        const group = acc[curr.group] || [];
        group.push(curr);
        acc[curr.group] = group;

        return acc;
      },
      {} as Record<string, Setting[]>,
    );
  }

  async getSchemaCatalog(): Promise<SettingSchemaCatalogEntry[]> {
    const settings = await this.findAll({
      order: { weight: 'ASC' },
    });
    const grouped = this.group(settings);
    const groups = new Set([
      ...Object.keys(BUILTIN_SETTING_GROUPS),
      ...Object.keys(grouped),
    ]);

    return Array.from(groups)
      .map((group) => this.buildSchemaCatalogEntry(group, grouped[group] ?? []))
      .filter((entry): entry is SettingSchemaCatalogEntry => entry !== null)
      .sort((left, right) => left.group.localeCompare(right.group));
  }

  async getSchemaGroup(group: string): Promise<SettingSchemaCatalogEntry> {
    const settings = await this.find({
      where: { group },
      order: { weight: 'ASC' },
    });
    const catalogEntry = this.buildSchemaCatalogEntry(group, settings);

    if (!catalogEntry) {
      throw new NotFoundException(`Unable to find settings group "${group}"`);
    }

    return catalogEntry;
  }

  async updateGroup(
    group: string,
    values: Record<string, unknown>,
  ): Promise<SettingSchemaCatalogEntry> {
    const currentSettings = await this.find({
      where: { group },
      order: { weight: 'ASC' },
    });
    const sources = this.resolveGroupSources(group, currentSettings);

    if (sources.length === 0) {
      throw new NotFoundException(`Unable to find settings group "${group}"`);
    }

    const parsedValues = buildSettingGroupZodSchema(sources).parse(values);
    const currentSettingsByLabel = new Map(
      currentSettings.map((setting) => [setting.label, setting]),
    );

    for (const source of sources) {
      if (!(source.label in parsedValues)) {
        continue;
      }

      const value = parsedValues[source.label] as Setting['value'];
      const existingSetting = currentSettingsByLabel.get(source.label);

      if (existingSetting?.id) {
        await this.updateOne(existingSetting.id, { value });
      } else {
        await this.create({
          group: source.group,
          subgroup: source.subgroup,
          label: source.label,
          schema: withSettingDefault(source.schema, value as Setting['value']),
          weight: source.weight,
          translatable: source.translatable,
        });
      }
    }

    await this.clearCache();

    return await this.getSchemaGroup(group);
  }

  /**
   * Retrieves the application configuration object.
   *
   * @returns The global configuration object.
   */
  getConfig(): Config {
    return config;
  }

  /**
   * Clears the settings cache
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.del(SETTING_CACHE_KEY);
    await this.cacheManager.del(ALLOWED_ORIGINS_CACHE_KEY);
  }

  /**
   * Event handler for setting updates. Listens to 'hook:setting:*' events
   * and invalidates the cache for settings when triggered.
   */
  @OnEvent('hook:setting:*')
  async handleSettingUpdateEvent(): Promise<void> {
    await this.clearCache();
  }

  /**
   * Retrieves a set of unique allowed origins for CORS configuration.
   *
   * This method combines all `allowed_domains` settings,
   * splits their values (comma-separated), and removes duplicates to produce a
   * whitelist of origins. The result is cached for better performance using the
   * `Cacheable` decorator with the key `ALLOWED_ORIGINS_CACHE_KEY`.
   *
   * @returns A promise that resolves to a set of allowed origins
   */
  @Cacheable(ALLOWED_ORIGINS_CACHE_KEY)
  async getAllowedOrigins(): Promise<string[]> {
    const settings = await this.find({
      where: { label: 'allowed_domains' },
    });
    const allowedDomains = settings.flatMap((setting) =>
      (typeof setting.value === 'string' ? setting.value : '')
        .split(',')
        .filter((origin) => origin),
    );
    const uniqueOrigins = new Set([
      ...config.security.cors.allowOrigins,
      ...config.sockets.onlyAllowOrigins,
      ...allowedDomains,
    ]);

    return Array.from(uniqueOrigins);
  }

  /**
   * Retrieves settings from the cache if available, or loads them from the
   * repository and caches the result.
   *
   * @returns A promise that resolves to a `Settings` object.
   */
  @Cacheable(SETTING_CACHE_KEY)
  async getSettings(): Promise<Settings> {
    const settings = await this.findAll();

    return this.buildTree(settings);
  }

  private resolveGroupSources(group: string, settings: Setting[]) {
    return mergeSettingGroupSources(BUILTIN_SETTING_GROUPS[group], settings);
  }

  private buildSchemaCatalogEntry(
    group: string,
    settings: Setting[],
  ): SettingSchemaCatalogEntry | null {
    const sources = this.resolveGroupSources(group, settings);

    if (sources.length === 0) {
      return null;
    }

    const schema = buildSettingGroupJsonSchema(sources);
    const propertyCount = Object.keys(schema.properties ?? {}).length;

    if (propertyCount === 0) {
      return null;
    }

    return {
      group,
      schema,
      values: buildSettingGroupValues(sources),
    };
  }
}
