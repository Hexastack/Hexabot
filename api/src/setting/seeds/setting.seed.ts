/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
