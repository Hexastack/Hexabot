/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { SETTING_CACHE_KEY } from '@/utils/constants/cache';
import { BaseSchema } from '@/utils/generics/base-schema';
import { BaseSeeder } from '@/utils/generics/base-seeder';

import { SettingRepository } from '../repositories/setting.repository';
import { Setting } from '../schemas/setting.schema';

@Injectable()
export class SettingSeeder extends BaseSeeder<Setting> {
  constructor(
    private readonly settingRepository: SettingRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(settingRepository);
  }

  async seed(models: Omit<Setting, keyof BaseSchema>[]): Promise<boolean> {
    const grouppedModels = models.reduce(
      (acc, model) => {
        if (!acc[model.group]) acc[model.group] = [model];
        else acc[model.group].push(model);

        return acc;
      },
      {} as Record<string, Omit<Setting, keyof BaseSchema>[]>,
    );

    Object.entries(grouppedModels).forEach(async ([group, models]) => {
      if ((await this.repository.count({ group })) === 0)
        await this.repository.createMany(models);
    });

    await this.cacheManager.del(SETTING_CACHE_KEY);

    return true;
  }
}
