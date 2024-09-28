/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { TranslationUpdateDto } from '../dto/translation.dto';
import { Translation } from '../schemas/translation.schema';
import { LanguageService } from '../services/language.service';
import { TranslationService } from '../services/translation.service';

@UseInterceptors(CsrfInterceptor)
@Controller('translation')
export class TranslationController extends BaseController<Translation> {
  constructor(
    private readonly languageService: LanguageService,
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
    const defaultLanguage = await this.languageService.getDefaultLanguage();
    const languages = await this.languageService.getLanguages();
    const defaultTrans: Translation['translations'] = Object.keys(languages)
      .filter((lang) => lang !== defaultLanguage.code)
      .reduce(
        (acc, curr) => {
          acc[curr] = '';
          return acc;
        },
        {} as { [key: string]: string },
      );
    // Scan Blocks
    let strings = await this.translationService.getAllBlockStrings();
    const settingStrings = await this.translationService.getSettingStrings();
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
        { str, translations: defaultTrans },
      ),
    );
    await Promise.all(queue);
    // Purge non existing translations
    return this.translationService.deleteMany({
      str: { $nin: strings },
    });
  }

  /**
   * Deletes a translation by its ID.
   * @param id - The ID of the translation to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.translationService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Translation by id ${id}`);
      throw new BadRequestException(
        `Unable to delete Translation with ID ${id}`,
      );
    }
    return result;
  }
}
