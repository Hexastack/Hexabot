/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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

import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { LanguageCreateDto, LanguageUpdateDto } from '../dto/language.dto';
import { Language } from '../schemas/language.schema';
import { LanguageService } from '../services/language.service';

@Controller('language')
export class LanguageController extends BaseController<Language> {
  constructor(private readonly languageService: LanguageService) {
    super(languageService);
  }

  /**
   * Retrieves a paginated list of languages based on provided filters and pagination settings.
   * @param pageQuery - The pagination settings.
   * @param filters - The filters to apply to the language search.
   * @returns A Promise that resolves to a paginated list of languages.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Language>,
    @Query(new SearchFilterPipe<Language>({ allowedFields: ['title', 'code'] }))
    filters: TFilterQuery<Language>,
  ) {
    return await this.languageService.find(filters, pageQuery);
  }

  /**
   * Counts the filtered number of languages.
   * @returns A promise that resolves to an object representing the filtered number of languages.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Language>({
        allowedFields: ['title', 'code'],
      }),
    )
    filters?: TFilterQuery<Language>,
  ) {
    return await this.count(filters);
  }

  /**
   * Finds a language by its ID.
   * @param id - The ID of the language to find.
   * @returns A Promise that resolves to the found language.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Language> {
    const doc = await this.languageService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Language by id ${id}`);
      throw new NotFoundException(`Language with ID ${id} not found`);
    }
    return doc;
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
    if ('isDefault' in languageUpdate) {
      if (languageUpdate.isDefault) {
        // A new default language is define, make sure that only one is marked as default
        await this.languageService.updateMany({}, { isDefault: false });
      } else {
        throw new BadRequestException('Should not be able to disable default');
      }
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
    const result = await this.languageService.deleteOne({
      isDefault: false, // Prevent deleting the default language
      _id: id,
    });
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Language by id ${id}`);
      throw new BadRequestException(`Unable to delete Language with ID ${id}`);
    }
    return result;
  }
}
