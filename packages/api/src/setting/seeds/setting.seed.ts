/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { SETTING_CACHE_KEY } from '@/utils/constants/cache';
import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { SettingCreateDto, SettingDtoConfig } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';

@Injectable()
export class SettingSeeder extends BaseOrmSeeder<
  SettingOrmEntity,
  SettingDtoConfig
> {
  constructor(
    settingRepository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(settingRepository);
  }

  async seed(models: SettingCreateDto[]): Promise<boolean> {
    let didCreate = false;
    const grouped = models.reduce<Record<string, SettingCreateDto[]>>(
      (acc, model) => {
        acc[model.group] = acc[model.group] || [];
        acc[model.group].push(model);

        return acc;
      },
      {},
    );

    for (const [group, settings] of Object.entries(grouped)) {
      const existing = await this.repository.find({
        where: { group },
        order: { weight: 'ASC' },
      });
      const existingLabels = new Set(existing.map((setting) => setting.label));
      const missingSettings = settings.filter(
        (setting) => !existingLabels.has(setting.label),
      );

      if (missingSettings.length > 0) {
        await this.repository.createMany(missingSettings);
        didCreate = true;
      }
    }

    await this.cacheManager.del(SETTING_CACHE_KEY);

    return didCreate;
  }
}
