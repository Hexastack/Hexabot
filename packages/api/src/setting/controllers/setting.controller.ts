/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Setting,
  SettingDtoConfig,
  SettingGroupUpdateDto,
  SettingUpdateDto,
} from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';
import { SettingService } from '../services/setting.service';

type SettingView = 'catalog' | undefined;

@Controller('setting')
export class SettingController extends BaseOrmController<
  SettingOrmEntity,
  SettingDtoConfig
> {
  constructor(protected readonly settingService: SettingService) {
    super(settingService);
  }

  /**
   * Finds settings that match the provided filters and sorting options.
   *
   * @param options - Combined filters, pagination, and sorting for the query.
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
    @Query('view') view?: SettingView,
  ) {
    if (view === 'catalog') {
      return await this.settingService.getSchemaCatalog();
    }

    return await this.settingService.find(options);
  }

  /**
   * Updates an entire settings group from a schema-backed payload.
   *
   * @param group - The group identifier to update.
   * @param settingGroupUpdateDto - The values to persist.
   *
   * @returns The refreshed schema-driven group payload.
   */
  @Patch('group/:group')
  async updateGroup(
    @Param('group') group: string,
    @Body() settingGroupUpdateDto: SettingGroupUpdateDto,
  ) {
    return await this.settingService.updateGroup(
      group,
      settingGroupUpdateDto.values,
    );
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
