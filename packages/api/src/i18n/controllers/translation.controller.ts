/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
} from '@nestjs/common';
import { FindManyOptions, In, Not } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  TranslationDtoConfig,
  TranslationTransformerDto,
  TranslationUpdateDto,
} from '../dto/translation.dto';
import { TranslationOrmEntity } from '../entities/translation.entity';
import { LanguageService } from '../services/language.service';
import { TranslationService } from '../services/translation.service';

@Controller('translation')
export class TranslationController extends BaseOrmController<
  TranslationOrmEntity,
  TranslationTransformerDto,
  TranslationDtoConfig
> {
  constructor(
    private readonly languageService: LanguageService,
    protected readonly translationService: TranslationService,
  ) {
    super(translationService);
  }

  @Get()
  async findPage(
    @Query(
      new TypeOrmSearchFilterPipe<TranslationOrmEntity>({
        allowedFields: ['str'],
      }),
    )
    options: FindManyOptions<TranslationOrmEntity>,
  ) {
    return await this.translationService.find(options);
  }

  /**
   * Counts the filtered number of translations.
   * @returns A promise that resolves to an object representing the filtered number of translations.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<TranslationOrmEntity>({
        allowedFields: ['str'],
      }),
    )
    options?: FindManyOptions<TranslationOrmEntity>,
  ) {
    return await super.count(options);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const translation = await this.translationService.findOne(id);
    if (!translation) {
      this.logger.warn(`Unable to find Translation by id ${id}`);
      throw new NotFoundException(`Translation with ID ${id} not found`);
    }
    return translation;
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() translationUpdate: TranslationUpdateDto,
  ) {
    return await this.translationService.updateOne(id, translationUpdate);
  }

  /**
   * Refresh translations : Add new strings and remove old ones
   * @returns {Promise<any>}
   */
  @Post('refresh')
  async refresh(): Promise<any> {
    const defaultLanguage = await this.languageService.getDefaultLanguage();
    const languages = await this.languageService.getLanguages();
    const defaultTrans: TranslationOrmEntity['translations'] = Object.keys(
      languages,
    )
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
        { where: { str } },
        { str, translations: defaultTrans },
      ),
    );
    await Promise.all(queue);
    // Purge non existing translations
    const deleteOptions: FindManyOptions<TranslationOrmEntity> =
      strings.length > 0 ? { where: { str: Not(In(strings)) } } : {};
    return await this.translationService.deleteMany(deleteOptions);
  }

  /**
   * Deletes a translation by its ID.
   * @param id - The ID of the translation to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
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
