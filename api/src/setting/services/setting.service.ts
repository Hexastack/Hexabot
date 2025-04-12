/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
import { BaseService } from '@/utils/generics/base-service';

import { SettingCreateDto } from '../dto/setting.dto';
import { SettingRepository } from '../repositories/setting.repository';
import { Setting } from '../schemas/setting.schema';
import { TextSetting } from '../schemas/types';
import { SettingSeeder } from '../seeds/setting.seed';

@Injectable()
export class SettingService extends BaseService<Setting> {
  constructor(
    readonly repository: SettingRepository,
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
  async seedIfNotExist(group: string, data: SettingCreateDto[]) {
    const count = await this.count({ group });
    if (count === 0) {
      await this.seeder.seed(data);
    }
  }

  /**
   * Loads all settings and returns them grouped in ascending order by weight.
   *
   * @returns A grouped object of settings.
   */
  async load() {
    const settings = await this.findAll(['weight', 'asc']);
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
    return settings.reduce((acc: Settings, s: Setting) => {
      const groupKey = s.group || 'undefinedGroup';

      acc[groupKey] = acc[groupKey] || {};
      acc[groupKey][s.label] = s.value;

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
    return (
      settings?.reduce((acc, curr) => {
        const group = acc[curr.group] || [];
        group.push(curr);
        acc[curr.group] = group;
        return acc;
      }, {}) || {}
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
  async clearCache() {
    this.cacheManager.del(SETTING_CACHE_KEY);
    this.cacheManager.del(ALLOWED_ORIGINS_CACHE_KEY);
  }

  /**
   * Event handler for setting updates. Listens to 'hook:setting:*' events
   * and invalidates the cache for settings when triggered.
   */
  @OnEvent('hook:setting:*')
  async handleSettingUpdateEvent() {
    this.clearCache();
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
      label: 'allowed_domains',
    })) as TextSetting[];

    const allowedDomains = settings.flatMap((setting) =>
      setting.value.split(',').filter((o) => !!o),
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
