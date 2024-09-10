/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { QuerySortDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { Setting } from '../schemas/setting.schema';
import { SettingService } from '../services/setting.service';

@UseInterceptors(CsrfInterceptor)
@Controller('setting')
export class SettingController {
  constructor(
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {}

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
    @Query(PageQueryPipe) { sort }: { sort: QuerySortDto<Setting> },
  ) {
    return await this.settingService.find(filters, sort);
  }

  /**
   * Loads all settings available in the system.
   *
   * @returns A list of all settings.
   */
  @Get('load')
  async load() {
    return await this.settingService.load();
  }

  /**
   * Updates a setting by its ID. If the setting does not exist, throws a `NotFoundException`.
   *
   * @param id - The ID of the setting to update.
   * @param settingUpdateDto - The new value of the setting.
   *
   * @returns The updated setting.
   */
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() settingUpdateDto: { value: any },
  ): Promise<Setting> {
    const result = await this.settingService.updateOne(id, settingUpdateDto);
    if (!result) {
      this.logger.warn(`Unable to update setting by id ${id}`);
      throw new NotFoundException(`Setting with ID ${id} not found`);
    }
    return result;
  }
}
