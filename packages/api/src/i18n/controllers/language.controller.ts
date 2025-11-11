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
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Language,
  LanguageCreateDto,
  LanguageDtoConfig,
  LanguageTransformerDto,
  LanguageUpdateDto,
} from '../dto/language.dto';
import { LanguageOrmEntity } from '../entities/language.entity';
import { LanguageService } from '../services/language.service';

@Controller('language')
export class LanguageController extends BaseOrmController<
  LanguageOrmEntity,
  LanguageTransformerDto,
  LanguageDtoConfig
> {
  constructor(protected readonly languageService: LanguageService) {
    super(languageService);
  }

  /**
   * Retrieves languages that match the provided filters, pagination, and sorting options.
   * @param options - Query options applied to the TypeORM repository.
   * @returns A Promise that resolves to a paginated list of languages.
   */
  @Get()
  async findPage(
    @Query(
      new TypeOrmSearchFilterPipe<LanguageOrmEntity>({
        allowedFields: ['title', 'code'],
      }),
    )
    options: FindManyOptions<LanguageOrmEntity>,
  ) {
    return await this.languageService.find(options);
  }

  /**
   * Counts the filtered number of languages.
   * @param options - Query options applied to the TypeORM repository.
   * @returns A promise that resolves to an object representing the filtered number of languages.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<LanguageOrmEntity>({
        allowedFields: ['title', 'code'],
      }),
    )
    options?: FindManyOptions<LanguageOrmEntity>,
  ) {
    return await super.count(options);
  }

  /**
   * Finds a language by its ID.
   * @param id - The ID of the language to find.
   * @returns A Promise that resolves to the found language.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Language> {
    const language = await this.languageService.findOne(id);
    if (!language) {
      this.logger.warn(`Unable to find Language by id ${id}`);
      throw new NotFoundException(`Language with ID ${id} not found`);
    }

    return language;
  }

  /**
   * Creates a new language.
   * @param language - The data of the language to be created.
   * @returns A Promise that resolves to the created language.
   */
  @Post()
  async create(@Body() language: LanguageCreateDto): Promise<Language> {
    return await this.languageService.create(language);
  }

  /**
   * Updates an existing language.
   * @param id - The ID of the language to be updated.
   * @param languageUpdate - The updated data for the language.
   * @returns A Promise that resolves to the updated language.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() languageUpdate: LanguageUpdateDto,
  ): Promise<Language> {
    if ('isDefault' in languageUpdate && !languageUpdate.isDefault) {
      throw new BadRequestException('Should not be able to disable default');
    }

    return await this.languageService.updateOne(id, languageUpdate);
  }

  /**
   * Deletes a language by its ID.
   * @param id - The ID of the language to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.languageService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Language by id ${id}`);
      throw new BadRequestException(`Unable to delete Language with ID ${id}`);
    }

    return result;
  }
}
