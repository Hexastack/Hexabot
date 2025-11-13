/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmController } from '@hexabot/core/database';
import { TypeOrmSearchFilterPipe } from '@hexabot/core/pipes';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import {
  Setting,
  SettingDtoConfig,
  SettingTransformerDto,
  SettingUpdateDto,
} from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';

@Controller('setting')
export class SettingController extends BaseOrmController<
  SettingOrmEntity,
  SettingTransformerDto,
  SettingDtoConfig
> {
  constructor(protected readonly settingService: SettingService) {
    super(settingService);
  }

  /**
   * Finds settings that match the provided filters and sorting options.
   *
   * @param filters - Filters to apply when querying settings, limited to the `group` field.
   * @param sort - Sorting options for the query.
   *
   * @returns A list of settings that match the criteria.
   */
  @Get()
  async find(
    @Query(
      new TypeOrmSearchFilterPipe<SettingOrmEntity>({
        allowedFields: ['group'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<SettingOrmEntity>,
  ) {
    return await this.settingService.find(options);
  }

  /**
   * Updates a setting by its ID. If the setting does not exist, throws a `NotFoundException`.
   *
   * @param id - The ID of the setting to update.
   * @param settingUpdateDto - The new value of the setting.
   *
   * @returns The updated setting.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() settingUpdateDto: SettingUpdateDto,
  ): Promise<Setting> {
    return await this.settingService.updateOne(id, settingUpdateDto);
  }
}
