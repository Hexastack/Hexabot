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
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { CategoryCreateDto, CategoryUpdateDto } from '../dto/category.dto';
import { Category } from '../schemas/category.schema';
import { CategoryService } from '../services/category.service';

@UseInterceptors(CsrfInterceptor)
@Controller('category')
export class CategoryController extends BaseController<Category> {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly logger: LoggerService,
  ) {
    super(categoryService);
  }

  /**
   * Retrieves a paginated list of categories based on provided filters and pagination settings.
   * @param pageQuery - The pagination settings.
   * @param filters - The filters to apply to the category search.
   * @returns A Promise that resolves to a paginated list of categories.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Category>,
    @Query(new SearchFilterPipe<Category>({ allowedFields: ['label'] }))
    filters: TFilterQuery<Category>,
  ) {
    return await this.categoryService.findPage(filters, pageQuery);
  }

  /**
   * Counts the filtered number of categories.
   * @returns A promise that resolves to an object representing the filtered number of categories.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Category>({
        allowedFields: ['label'],
      }),
    )
    filters?: TFilterQuery<Category>,
  ) {
    return await this.count(filters);
  }

  /**
   * Finds a category by its ID.
   * @param id - The ID of the category to find.
   * @returns A Promise that resolves to the found category.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    const doc = await this.categoryService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Category by id ${id}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Creates a new category.
   * @param category - The data of the category to be created.
   * @returns A Promise that resolves to the created category.
   */
  @CsrfCheck(true)
  @Post()
  async create(@Body() category: CategoryCreateDto): Promise<Category> {
    return await this.categoryService.create(category);
  }

  /**
   * Updates an existing category.
   * @param id - The ID of the category to be updated.
   * @param categoryUpdate - The updated data for the category.
   * @returns A Promise that resolves to the updated category.
   */
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() categoryUpdate: CategoryUpdateDto,
  ): Promise<Category> {
    const result = await this.categoryService.updateOne(id, categoryUpdate);
    if (!result) {
      this.logger.warn(`Unable to update Category by id ${id}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes a category by its ID.
   * @param id - The ID of the category to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @CsrfCheck(true)
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.categoryService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Category by id ${id}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return result;
  }
}
