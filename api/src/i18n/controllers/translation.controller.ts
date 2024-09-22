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
  Post,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { TranslationUpdateDto } from '../dto/translation.dto';
import { Translation } from '../schemas/translation.schema';
import { TranslationService } from '../services/translation.service';

@UseInterceptors(CsrfInterceptor)
@Controller('translation')
export class TranslationController extends BaseController<Translation> {
  constructor(
    private readonly translationService: TranslationService,
    private readonly settingService: SettingService,
    private readonly logger: LoggerService,
  ) {
    super(translationService);
  }

  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Translation>,
    @Query(new SearchFilterPipe<Translation>({ allowedFields: ['str'] }))
    filters: TFilterQuery<Translation>,
  ) {
    return await this.translationService.findPage(filters, pageQuery);
  }

  /**
   * Counts the filtered number of translations.
   * @returns A promise that resolves to an object representing the filtered number of translations.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Translation>({
        allowedFields: ['str'],
      }),
    )
    filters?: TFilterQuery<Translation>,
  ) {
    return await this.count(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.translationService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Translation by id ${id}`);
      throw new NotFoundException(`Translation with ID ${id} not found`);
    }
    return doc;
  }

  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() translationUpdate: TranslationUpdateDto,
  ) {
    const result = await this.translationService.updateOne(
      id,
      translationUpdate,
    );
    if (!result) {
      this.logger.warn(`Unable to update Translation by id ${id}`);
      throw new NotFoundException(`Translation with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Refresh translations : Add new strings and remove old ones
   * @returns {Promise<any>}
   */
  @CsrfCheck(true)
  @Post('refresh')
  async refresh(): Promise<any> {
    const settings = await this.settingService.getSettings();
    const languages = settings.nlp_settings.languages;
    const defaultTrans: Translation['translations'] = languages.reduce(
      (acc, curr) => {
        acc[curr] = '';
        return acc;
      },
      {} as { [key: string]: string },
    );
    // Scan Blocks
    return this.translationService
      .getAllBlockStrings()
      .then(async (strings: string[]) => {
        const settingStrings =
          await this.translationService.getSettingStrings();
        // Scan global settings
        strings = strings.concat(settingStrings);
        // Filter unique and not empty messages
        strings = strings.filter((str, pos) => {
          return str && strings.indexOf(str) == pos;
        });
        // Perform refresh
        const queue = strings.map((str) =>
          this.translationService.findOneOrCreate(
            { str },
            { str, translations: defaultTrans as any, translated: 100 },
          ),
        );
        return Promise.all(queue).then(() => {
          // Purge non existing translations
          return this.translationService.deleteMany({
            str: { $nin: strings },
          });
        });
      });
  }
}
