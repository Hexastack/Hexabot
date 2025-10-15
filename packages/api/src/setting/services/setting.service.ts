/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { config } from '@/config';
import { Config } from '@/config/types';
import {
  ALLOWED_ORIGINS_CACHE_KEY,
  SETTING_CACHE_KEY,
} from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { DeleteResult } from '@/utils/generics/base-repository';
import {
  PageQueryDto,
  QuerySortDto,
} from '@/utils/pagination/pagination-query.dto';
import { TFilterQuery } from '@/utils/types/filter.types';

import { SettingCreateDto, SettingUpdateDto } from '../dto/setting.dto';
import { Setting } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';
import { SettingSeed, TextSetting } from '../types';

@Injectable()
export class SettingService {
  constructor(
    private readonly repository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async seedIfNotExist(
    group: string,
    data: readonly SettingSeed[],
  ): Promise<void> {
    const count = await this.count({ group });
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
    const settings = await this.findAll(['weight', 'asc']);
    return this.group(settings);
  }

  async find(
    filter: TFilterQuery<Setting> = {},
    pageQuery?: PageQueryDto<Setting>,
  ): Promise<Setting[]> {
    return await this.repository.find(filter, pageQuery);
  }

  async findAll(sort?: QuerySortDto<Setting>): Promise<Setting[]> {
    return await this.repository.findAll(sort);
  }

  async count(filter: TFilterQuery<Setting> = {}): Promise<number> {
    return await this.repository.count(filter);
  }

  async findOne(
    criteria: string | TFilterQuery<Setting>,
  ): Promise<Setting | null> {
    return await this.repository.findOne(criteria);
  }

  async create(dto: SettingCreateDto): Promise<Setting> {
    this.repository.validateSettingValue(dto.type, dto.value);
    const created = await this.repository.create(dto);
    await this.clearCache();
    return created;
  }

  async createMany(dtos: SettingCreateDto[]): Promise<Setting[]> {
    dtos.forEach((dto) =>
      this.repository.validateSettingValue(dto.type, dto.value),
    );
    const created = await this.repository.createMany(dtos);
    await this.clearCache();
    return created;
  }

  async updateOne(
    criteria: string | TFilterQuery<Setting>,
    dto: SettingUpdateDto | Partial<Setting>,
  ): Promise<Setting> {
    const existing = await this.findOne(criteria);
    if (!existing) {
      throw new NotFoundException('Setting not found');
    }

    if ('value' in dto) {
      this.repository.validateSettingValue(existing.type, dto.value);
    }

    const updated = await this.repository.update(existing.id, dto);
    if (!updated) {
      throw new NotFoundException('Unable to update setting');
    }

    await this.clearCache();

    const group = updated.group;
    const label = updated.label;
    const eventName = `hook:${group}:${label}`;
    (this.eventEmitter as any).emit(eventName, updated);

    return updated;
  }

  async deleteMany(filter: TFilterQuery<Setting>): Promise<DeleteResult> {
    const result = await this.repository.deleteMany(filter);
    if (result.deletedCount > 0) {
      await this.clearCache();
    }
    return result;
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
      label: 'allowed_domains',
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
