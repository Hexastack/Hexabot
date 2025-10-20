/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
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
  SettingTransformerDto,
} from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import { SettingSeeder } from '../seeds/setting.seed';
import { TextSetting } from '../types';

@Injectable()
export class SettingService extends BaseOrmService<
  SettingOrmEntity,
  SettingTransformerDto,
  SettingDtoConfig,
  SettingRepository
> {
  constructor(
    repository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly seeder: SettingSeeder,
  ) {
    super(repository);
  }

  /**
   * Seeds the settings if they don't already exist for the provided group.
   *
   * @param group - The group of settings to check.
   * @param data - The array of settings to seed if none exist.
   */
  async seedIfNotExist(group: string, data: SettingCreateDto[]): Promise<void> {
    const count = await this.count({ where: { group } });
    if (count === 0) {
      await this.seeder.seed(data);
    }
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
    const settings = (await this.find({
      where: { label: 'allowed_domains' },
    })) as TextSetting[];

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
}
