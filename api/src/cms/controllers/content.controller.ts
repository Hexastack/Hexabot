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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { ContentCreateDto, ContentUpdateDto } from '../dto/content.dto';
import {
  Content,
  ContentFull,
  ContentPopulate,
  ContentStub,
} from '../schemas/content.schema';

import { ContentTypeService } from './../services/content-type.service';
import { ContentService } from './../services/content.service';

@Controller('content')
export class ContentController extends BaseController<
  Content,
  ContentStub,
  ContentPopulate,
  ContentFull
> {
  constructor(
    private readonly contentService: ContentService,
    private readonly contentTypeService: ContentTypeService,
  ) {
    super(contentService);
  }

  /**
   * Creates new content based on the provided DTO, filtering dynamic fields to match
   * the associated content type before persisting it.
   *
   * @param contentDto - The DTO containing the content data to be created.
   *
   * @returns The created content document.
   */
  @Post()
  async create(@Body() contentDto: ContentCreateDto): Promise<Content> {
    // Find the content type that corresponds to the given content
    const contentType = await this.contentTypeService.findOne(
      contentDto.entity,
    );
    this.validate({
      dto: contentDto,
      allowedIds: {
        entity: contentType?.id,
      },
    });
    return await this.contentService.create(contentDto);
  }

  /**
   * Imports content from a CSV file based on the provided content type and file ID.
   *
   * @param idTargetContentType - The content type to match the CSV data against.   *
   * @returns A promise that resolves to the newly created content documents.
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Query('idTargetContentType')
    targetContentType: string,
  ) {
    const datasetContent = file.buffer.toString('utf-8');
    if (!targetContentType) {
      this.logger.warn(`Parameter is missing`);
      throw new NotFoundException(`Missing parameter`);
    }
    const contentType =
      await this.contentTypeService.findOne(targetContentType);
    if (!contentType) {
      this.logger.warn(
        `Failed to fetch content type with id ${targetContentType}. Content type not found.`,
      );
      throw new NotFoundException(`Content type is not found`);
    }

    return await this.contentService.parseAndSaveDataset(
      datasetContent,
      targetContentType,
      contentType,
    );
  }

  /**
   * Retrieves paginated content based on filters and optional population of related entities.
   *
   * @param pageQuery - Pagination parameters.
   * @param populate - Fields to populate in the query.
   * @param filters - Filters for content retrieval.
   *
   * @returns Paginated content list.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Content>,
    @Query(PopulatePipe) populate: string[],
    @Query(
      new SearchFilterPipe<Content>({ allowedFields: ['entity', 'title'] }),
    )
    filters: TFilterQuery<Content>,
  ) {
    return this.canPopulate(populate)
      ? await this.contentService.findAndPopulate(filters, pageQuery)
      : await this.contentService.find(filters, pageQuery);
  }

  /**
   * Counts the filtered number of contents based on the provided filters.
   *
   * @param filters - Optional filters for counting content.
   *
   * @returns The count of content matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Content>({ allowedFields: ['entity', 'title'] }),
    )
    filters?: TFilterQuery<Content>,
  ) {
    return await this.count(filters);
  }

  /**
   * Retrieves a single content by ID, with optional population of related entities.
   *
   * @param id - The ID of the content to retrieve.
   * @param populate - Fields to populate in the query.
   *
   * @returns The requested content document.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe) populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.contentService.findOneAndPopulate(id)
      : await this.contentService.findOne(id);

    if (!doc) {
      this.logger.warn(
        `Failed to fetch content with id ${id}. Content not found.`,
      );
      throw new NotFoundException(`Content of id ${id} not found`);
    }
    return doc;
  }

  /**
   * Deletes a content document by ID.
   *
   * @param id - The ID of the content to delete.
   *
   * @returns The result of the delete operation.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const removedContent = await this.contentService.deleteOne(id);
    if (removedContent.deletedCount === 0) {
      this.logger.warn(
        `Failed to delete content with id ${id}. Content not found.`,
      );
      throw new NotFoundException(`Content of id ${id} not found`);
    }
    return removedContent;
  }

  /**
   * Retrieves content based on content type ID with optional pagination.
   *
   * @param contentType - The content type ID to filter by.
   * @param pageQuery - Pagination parameters.
   *
   * @returns List of content documents matching the content type.
   */
  @Get('/type/:id')
  async findByType(
    @Param('id') contentType: string,
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Content>,
  ): Promise<Content[]> {
    const type = await this.contentTypeService.findOne(contentType);
    if (!type) {
      this.logger.warn(
        `Failed to find content with contentType ${contentType}. ContentType not found.`,
      );
      throw new NotFoundException(`ContentType of id ${contentType} not found`);
    }
    return await this.contentService.find({ entity: contentType }, pageQuery);
  }

  /**
   * Updates a content document by ID, after filtering dynamic fields to match the associated content type.
   *
   * @param contentDto - The DTO containing the updated content data.
   * @param id - The ID of the content to update.
   *
   * @returns The updated content document.
   */
  @Patch(':id')
  async updateOne(
    @Body() contentDto: ContentUpdateDto,
    @Param('id') id: string,
  ): Promise<Content> {
    return await this.contentService.updateOne(id, contentDto);
  }
}
