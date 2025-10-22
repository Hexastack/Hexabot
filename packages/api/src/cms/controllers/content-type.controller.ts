/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  ContentType,
  ContentTypeCreateDto,
  ContentTypeDtoConfig,
  ContentTypeTransformerDto,
  ContentTypeUpdateDto,
} from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentTypeService } from '../services/content-type.service';

@Controller('contenttype')
export class ContentTypeController extends BaseOrmController<
  ContentTypeOrmEntity,
  ContentTypeTransformerDto,
  ContentTypeDtoConfig
> {
  constructor(protected readonly contentTypeService: ContentTypeService) {
    super(contentTypeService);
  }

  /**
   * Creates a new content type.
   *
   * @param contentTypeDto - The data transfer object containing the content type information.
   *
   * @returns The created content type.
   */
  @Post()
  async create(
    @Body() contentTypeDto: ContentTypeCreateDto,
  ): Promise<ContentType> {
    return await this.contentTypeService.create(contentTypeDto);
  }

  /**
   * Retrieves a list of content types based on TypeORM query options.
   *
   * @param options - Combined filters, pagination, and sorting for the query.
   *
   * @returns Content types matching the provided query options.
   */
  @Get()
  async find(
    @Query(
      new TypeOrmSearchFilterPipe<ContentTypeOrmEntity>({
        allowedFields: ['name'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<ContentTypeOrmEntity>,
  ) {
    return await this.contentTypeService.find(options);
  }

  /**
   * Retrieves the count of content types matching the provided options.
   *
   * @param options - Filters applied to the count query.
   *
   * @returns The number of content types matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<ContentTypeOrmEntity>({
        allowedFields: ['name'],
      }),
    )
    options: FindManyOptions<ContentTypeOrmEntity>,
  ) {
    return super.count(options);
  }

  /**
   * Retrieves a single content type by its ID.
   *
   * @param id - The ID of the content type to retrieve.
   *
   * @returns The content type matching the provided ID.
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContentType> {
    const foundContentType = await this.contentTypeService.findOne(id);
    if (!foundContentType) {
      this.logger.warn(
        `Failed to fetch content type with id ${id}. Content type not found.`,
      );
      throw new NotFoundException(`Content type with id ${id} not found`);
    }
    return foundContentType;
  }

  /**
   * Deletes a single content type by its ID.
   *
   * @param id - The ID of the content type to delete.
   *
   * @returns The result of the delete operation.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const removedType = await this.contentTypeService.deleteOne(id);

    if (removedType.deletedCount === 0) {
      this.logger.warn(
        `Failed to delete content type with id ${id}. Content type not found.`,
      );
      throw new NotFoundException(`Content type with id ${id} not found`);
    }
    return removedType;
  }

  /**
   * Updates a content type by its ID.
   *
   * @param contentTypeDto - The data transfer object containing updated content type information.
   * @param id - The ID of the content type to update.
   *
   * @returns The updated content type.
   */
  @Patch(':id')
  async updateOne(
    @Body() contentTypeDto: ContentTypeUpdateDto,
    @Param('id') id: string,
  ): Promise<ContentType> {
    return await this.contentTypeService.updateOne(id, contentTypeDto);
  }
}
