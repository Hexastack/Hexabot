/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmController, DeleteResult } from '@hexabot/core/database';
import { TypeOrmSearchFilterPipe } from '@hexabot/core/pipes';
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
import { FindManyOptions, In } from 'typeorm';

import {
  Category,
  CategoryCreateDto,
  CategoryDtoConfig,
  CategoryTransformerDto,
  CategoryUpdateDto,
} from '../dto/category.dto';
import { CategoryOrmEntity } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';

@Controller('category')
export class CategoryController extends BaseOrmController<
  CategoryOrmEntity,
  CategoryTransformerDto,
  CategoryDtoConfig
> {
  constructor(private readonly categoryService: CategoryService) {
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
    @Query(
      new TypeOrmSearchFilterPipe<CategoryOrmEntity>({
        allowedFields: ['label', 'builtin'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<CategoryOrmEntity>,
  ) {
    return await this.categoryService.find(options ?? {});
  }

  /**
   * Counts the filtered number of categories.
   * @returns A promise that resolves to an object representing the filtered number of categories.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<CategoryOrmEntity>({
        allowedFields: ['label', 'builtin'],
      }),
    )
    options?: FindManyOptions<CategoryOrmEntity>,
  ) {
    return await this.count(options ?? {});
  }

  /**
   * Finds a category by its ID.
   * @param id - The ID of the category to find.
   * @returns A Promise that resolves to the found category.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    const record = await this.categoryService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find Category by id ${id}`);
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Creates a new category.
   * @param category - The data of the category to be created.
   * @returns A Promise that resolves to the created category.
   */
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
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() categoryUpdate: CategoryUpdateDto,
  ): Promise<Category> {
    return await this.categoryService.updateOne(id, categoryUpdate);
  }

  /**
   * Deletes a category by its ID.
   * @param id - The ID of the category to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
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

  /**
   * Deletes multiple categories by their IDs.
   * @param ids - IDs of categories to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.categoryService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete categories with provided IDs: ${ids}`);
      throw new NotFoundException('Categories with provided IDs not found');
    }

    this.logger.log(`Successfully deleted categories with IDs: ${ids}`);

    return deleteResult;
  }
}
