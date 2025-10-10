/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { Setting } from '../schemas/setting.schema';
import { SettingService } from '../services/setting.service';

@Controller('setting')
export class SettingController extends BaseController<Setting> {
  constructor(private readonly settingService: SettingService) {
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
      new SearchFilterPipe<Setting>({
        allowedFields: ['group'],
      }),
    )
    filters: TFilterQuery<Setting>,
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Setting>,
  ) {
    return await this.settingService.find(filters, pageQuery);
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
    @Body() settingUpdateDto: { value: any },
  ): Promise<Setting> {
    return await this.settingService.updateOne(id, settingUpdateDto);
  }
}
