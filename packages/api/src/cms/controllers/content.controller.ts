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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindManyOptions, FindOptionsWhere } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Content,
  ContentCreateDto,
  ContentDtoConfig,
  ContentTransformerDto,
  ContentUpdateDto,
} from '../dto/content.dto';
import { ContentOrmEntity } from '../entities/content.entity';

import { ContentTypeService } from './../services/content-type.service';
import { ContentService } from './../services/content.service';

@Controller('content')
export class ContentController extends BaseOrmController<
  ContentOrmEntity,
  ContentTransformerDto,
  ContentDtoConfig
> {
  constructor(
    protected readonly contentService: ContentService,
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
    if (!contentType) {
      this.logger.warn(
        `Failed to fetch content type with id ${contentDto.entity}. Content type not found.`,
      );
      throw new NotFoundException('Content type not found');
    }
    this.validate({
      dto: contentDto,
      allowedIds: { entity: contentType?.id },
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
   * Retrieves content based on query options with optional population of related entities.
   *
   * @param populate - Fields to populate in the query.
   * @param options - Combined filters, pagination, and sorting for the query.
   *
   * @returns Content list.
   */
  @Get()
  async find(
    @Query(PopulatePipe) populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<ContentOrmEntity>({
        allowedFields: ['entity', 'title'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<ContentOrmEntity>,
  ) {
    return this.canPopulate(populate)
      ? await this.contentService.findAndPopulate(options)
      : await this.contentService.find(options);
  }

  /**
   * Counts the filtered number of contents based on the provided options.
   *
   * @param options - Filters applied to the count query.
   *
   * @returns The count of content matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<ContentOrmEntity>({
        allowedFields: ['entity', 'title'],
      }),
    )
    options?: FindManyOptions<ContentOrmEntity>,
  ) {
    return super.count(options);
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
   * @param options - Query options applied to the lookup.
   *
   * @returns List of content documents matching the content type.
   */
  @Get('/type/:id')
  async findByType(
    @Param('id') contentType: string,
    @Query(
      new TypeOrmSearchFilterPipe<ContentOrmEntity>({
        allowedFields: ['entity', 'title'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<ContentOrmEntity>,
  ): Promise<Content[]> {
    const type = await this.contentTypeService.findOne(contentType);
    if (!type) {
      this.logger.warn(
        `Failed to find content with contentType ${contentType}. ContentType not found.`,
      );
      throw new NotFoundException(`ContentType of id ${contentType} not found`);
    }
    const mergeEntityConstraint = (
      incoming:
        | FindOptionsWhere<ContentOrmEntity>
        | FindOptionsWhere<ContentOrmEntity>[]
        | undefined,
    ):
      | FindOptionsWhere<ContentOrmEntity>
      | FindOptionsWhere<ContentOrmEntity>[] => {
      if (Array.isArray(incoming) && incoming.length) {
        return incoming.map((clause) => ({
          ...(clause ?? {}),
          entity: contentType,
        }));
      }

      return {
        ...(incoming ?? {}),
        entity: contentType,
      };
    };

    const nextOptions: FindManyOptions<ContentOrmEntity> = {
      ...options,
      where: mergeEntityConstraint(
        options.where as
          | FindOptionsWhere<ContentOrmEntity>
          | FindOptionsWhere<ContentOrmEntity>[]
          | undefined,
      ),
    };
    return await this.contentService.find(nextOptions);
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
