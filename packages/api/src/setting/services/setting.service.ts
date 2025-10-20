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
import { SettingSeed, TextSetting } from '../types';

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
  ) {
    super(repository);
  }

  async seedIfNotExist(
    group: string,
    data: readonly SettingSeed[],
  ): Promise<void> {
    const count = await this.count({ where: { group } });
    if (count === 0) {
      const prepared = data.map(
        (item, index): SettingCreateDto => ({
          ...item,
          weight: item.weight ?? index + 1,
        }),
      );
      await this.createMany(prepared);
    }
  }

  async load(): Promise<Record<string, Setting[]>> {
    const settings = await this.findAll({
      order: { weight: 'ASC' },
    });
    return this.group(settings);
  }

  public buildTree(settings: Setting[]): Settings {
    return settings.reduce((acc: Settings, setting: Setting) => {
      const groupKey = setting.group || 'undefinedGroup';

      acc[groupKey] = acc[groupKey] || {};
      acc[groupKey][setting.label] = setting.value;

      return acc;
    }, {} as Settings);
  }

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

  getConfig(): Config {
    return config;
  }

  async clearCache(): Promise<void> {
    await this.cacheManager.del(SETTING_CACHE_KEY);
    await this.cacheManager.del(ALLOWED_ORIGINS_CACHE_KEY);
  }

  @OnEvent('hook:setting:*')
  async handleSettingUpdateEvent(): Promise<void> {
    await this.clearCache();
  }

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

  @Cacheable(SETTING_CACHE_KEY)
  async getSettings(): Promise<Settings> {
    const settings = await this.findAll();
    return this.buildTree(settings);
  }
}
