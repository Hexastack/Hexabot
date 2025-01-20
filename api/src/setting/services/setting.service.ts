/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';

import { config } from '@/config';
import { Config } from '@/config/types';
import { LoggerService } from '@/logger/logger.service';
import { SETTING_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseService } from '@/utils/generics/base-service';

import { SettingCreateDto } from '../dto/setting.dto';
import { SettingRepository } from '../repositories/setting.repository';
import { Setting } from '../schemas/setting.schema';
import { SettingSeeder } from '../seeds/setting.seed';

//TODO : change to enum?
type Channels = 'console-channel' | 'web-channel';

@Injectable()
export class SettingService
  extends BaseService<Setting>
  implements OnModuleInit
{
  private allowedOrigins: Map<Channels, Set<string>> = new Map();

  constructor(
    readonly repository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
    private readonly seeder: SettingSeeder,
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
  ) {
    super(repository);
    const origins: Channels[] = ['console-channel', 'web-channel'];
    origins.forEach((channelType) => {
      this.allowedOrigins.set(channelType, new Set<string>());
    });
  }

  async onModuleInit() {
    try {
      //TODO: refactor into initialize methods
      const webChannelAllowedDomains = await this.find({
        group: 'web_channel',
        label: 'allowed_domains',
      });
      const consoleChannelAllowedDomains = await this.find({
        group: 'console_channel',
        label: 'allowed_domains',
      });

      webChannelAllowedDomains.forEach((webChannelSettings) => {
        (webChannelSettings.value.split(',') || []).forEach(
          (allowedDomain: string) => {
            this.allowedOrigins.get('web-channel').add(allowedDomain);
          },
        );
      });

      consoleChannelAllowedDomains.forEach((consoleChannelSettings) => {
        (consoleChannelSettings.value.split(',') || []).forEach(
          (allowedDomain: string) => {
            this.allowedOrigins.get('console-channel').add(allowedDomain);
          },
        );
      });
      this.logger.log('allowed domains initialiazed successfully');
    } catch (error) {
      this.logger.error('Failed to initialiazed allowed domains', error);
    }
  }

  @OnEvent('hook:web_channel:allowed_domains')
  handleUpdateWebChannelAllowedDomains(settings: Setting) {
    this.allowedOrigins.get('web-channel').clear();
    (settings.value.split(',') || []).forEach((allowedDomain: string) => {
      this.allowedOrigins.get('web-channel').add(allowedDomain);
    });
  }

  @OnEvent('hook:console_channel:allowed_domains')
  handleUpdateConsoleChannelAllowedDomains(settings: Setting) {
    this.allowedOrigins.get('console-channel').clear();

    (settings.value.split(',') || []).forEach((allowedDomain: string) => {
      this.allowedOrigins.get('console-channel').add(allowedDomain);
    });
  }

  private isOriginAllowedConsoleChannel(requesterOrigin: string) {
    return this.allowedOrigins.get('console-channel').has(requesterOrigin);
  }

  private isOriginAllowedWebChannel(requesterOrigin: string) {
    return this.allowedOrigins.get('web-channel').has(requesterOrigin);
  }

  public isOriginAllowed(requesterOrigin: string) {
    return (
      this.isOriginAllowedConsoleChannel(requesterOrigin) ||
      this.isOriginAllowedWebChannel(requesterOrigin)
    );
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

  /**
   * Fetches all settings labeled as 'allowed_domains'.
   * @returns An array of allowed domains.
   */
  async getAllowedDomains(): Promise<string[]> {
    const settings = await this.settingModel
      .find({ label: 'allowed_domains' })
      .exec();
    return settings
      .map((setting) => setting.value.split(',').map((domain) => domain.trim()))
      .flat();
  }
}
