/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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

import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  ContentTypeCreateDto,
  ContentTypeUpdateDto,
} from '../dto/contentType.dto';
import { ContentType } from '../schemas/content-type.schema';
import { ContentTypeService } from '../services/content-type.service';

@Controller('contenttype')
export class ContentTypeController extends BaseController<ContentType> {
  constructor(private readonly contentTypeService: ContentTypeService) {
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
   * Retrieves a paginated list of content types based on query parameters.
   *
   * @param pageQuery - The pagination options for the query.
   * @param filters - The query filters applied to the content types (e.g., by name).
   *
   * @returns A paginated list of content types matching the provided filters.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<ContentType>,
    @Query(new SearchFilterPipe<ContentType>({ allowedFields: ['name'] }))
    filters: TFilterQuery<ContentType>,
  ) {
    return await this.contentTypeService.find(filters, pageQuery);
  }

  /**
   * Retrieves the count of content types matching the provided filters.
   *
   * @param filters - The filters applied to the count query.
   *
   * @returns The number of content types matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(new SearchFilterPipe<ContentType>({ allowedFields: ['name'] }))
    filters: TFilterQuery<ContentType>,
  ) {
    return await this.count(filters);
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
    const removedType = await this.contentTypeService.deleteCascadeOne(id);

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
  ) {
    return await this.contentTypeService.updateOne(id, contentTypeDto);
  }
}
