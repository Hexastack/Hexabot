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

import { Setting } from '../entities/setting.entity';
import { SettingRepository } from '../repositories/setting.repository';

type SeedSetting = Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class SettingSeeder extends BaseOrmSeeder<Setting, SettingRepository> {
  constructor(
    settingRepository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(settingRepository);
  }

  async seed(models: SeedSetting[]): Promise<boolean> {
    const grouped = models.reduce<Record<string, SeedSetting[]>>(
      (acc, model) => {
        acc[model.group] = acc[model.group] || [];
        acc[model.group].push(model);
        return acc;
      },
      {},
    );

    for (const [group, settings] of Object.entries(grouped)) {
      if (await this.isEmpty({ group })) {
        settings.forEach((setting) =>
          this.repository.validateSettingValue(setting.type, setting.value),
        );
        await this.repository.createMany(settings);
      }
    }

    await this.cacheManager.del(SETTING_CACHE_KEY);

    return true;
  }
}
