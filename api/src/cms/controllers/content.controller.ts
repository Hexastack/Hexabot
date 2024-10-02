/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';
import path from 'path';

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
import { BadRequestException } from '@nestjs/common/exceptions';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';
import Papa from 'papaparse';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { config } from '@/config';
import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { ContentTypeService } from './../services/content-type.service';
import { ContentService } from './../services/content.service';
import { ContentCreateDto, ContentUpdateDto } from '../dto/content.dto';
import { ContentTransformInterceptor } from '../interceptors/content.interceptor';
import { ContentType } from '../schemas/content-type.schema';
import {
  Content,
  ContentFull,
  ContentPopulate,
  ContentStub,
} from '../schemas/content.schema';
import { preprocessDynamicFields } from '../utilities';

@UseInterceptors(ContentTransformInterceptor, CsrfInterceptor)
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
    private readonly attachmentService: AttachmentService,
    private readonly logger: LoggerService,
  ) {
    super(contentService);
  }

  /**
   * Filters and processes dynamic fields in the content DTO based on the associated content type.
   * It ensures that only fields matching the content type are passed forward.
   *
   * @param contentDto - The content DTO containing dynamic fields.
   * @param contentType - The content type schema defining valid fields.
   *
   * @returns The content DTO with filtered dynamic fields.
   */
  filterDynamicFields(
    contentDto: ContentCreateDto | ContentUpdateDto,
    contentType: ContentType,
  ): ContentCreateDto | ContentUpdateDto {
    if (!contentType) {
      this.logger.warn(
        `Content type of id ${contentDto.entity}. Content type not found.`,
      );
      throw new NotFoundException(
        `Content type of id ${contentDto.entity} not found`,
      );
    }
    // Filter the fields coming from the request body to correspond to the contentType
    const dynamicFields = contentType.fields.reduce((acc, { name }) => {
      return name in contentDto.dynamicFields && contentDto.dynamicFields[name]
        ? { ...acc, [name]: contentDto.dynamicFields[name] }
        : acc;
    }, {});

    return { ...contentDto, dynamicFields };
  }

  /**
   * Creates new content based on the provided DTO, filtering dynamic fields to match
   * the associated content type before persisting it.
   *
   * @param contentDto - The DTO containing the content data to be created.
   *
   * @returns The created content document.
   */
  @CsrfCheck(true)
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
    const newContent = this.filterDynamicFields(
      contentDto,
      contentType,
    ) as ContentCreateDto;
    return await this.contentService.create(newContent);
  }

  /**
   * Imports content from a CSV file based on the provided content type and file ID.
   *
   * @param idTargetContentType - The content type to match the CSV data against.
   * @param idFileToImport - The ID of the file to be imported.
   *
   * @returns A promise that resolves to the newly created content documents.
   */
  @Get('import/:idTargetContentType/:idFileToImport')
  async import(
    @Param()
    {
      idTargetContentType: targetContentType,
      idFileToImport: fileToImport,
    }: {
      idTargetContentType: string;
      idFileToImport: string;
    },
  ) {
    // Check params
    if (!fileToImport || !targetContentType) {
      this.logger.warn(`Parameters are missing`);
      throw new NotFoundException(`Missing params`);
    }

    // Find the content type that corresponds to the given content
    const contentType =
      await this.contentTypeService.findOne(targetContentType);
    if (!contentType) {
      this.logger.warn(
        `Failed to fetch content type with id ${targetContentType}. Content type not found.`,
      );
      throw new NotFoundException(`Content type is not found`);
    }

    // Get file location
    const file = await this.attachmentService.findOne(fileToImport);
    // Check if file is present
    const filePath = file
      ? path.join(config.parameters.uploadDir, file.location)
      : undefined;

    if (!file || !fs.existsSync(filePath)) {
      this.logger.warn(`Failed to find file type with id ${fileToImport}.`);
      throw new NotFoundException(`File does not exist`);
    }
    //read file sync
    const data = fs.readFileSync(filePath, 'utf8');

    const result = Papa.parse<Record<string, string | boolean | number>>(data, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (result.errors.length > 0) {
      this.logger.warn(
        `Errors parsing the file: ${JSON.stringify(result.errors)}`,
      );

      throw new BadRequestException(result.errors, {
        cause: result.errors,
        description: 'Error while parsing CSV',
      });
    }

    const contentsDto = result.data.map((content) => {
      content.entity = targetContentType;
      const dto = preprocessDynamicFields(content);
      // Match headers against entity fields
      return this.filterDynamicFields(dto, contentType);
    }) as ContentCreateDto[];

    // Create content
    return await this.contentService.createMany(contentsDto);
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
    return await this.contentService.findPage(filters, pageQuery);
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
  @CsrfCheck(true)
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
    return await this.contentService.findPage(
      { entity: contentType },
      pageQuery,
    );
  }

  /**
   * Updates a content document by ID, after filtering dynamic fields to match the associated content type.
   *
   * @param contentDto - The DTO containing the updated content data.
   * @param id - The ID of the content to update.
   *
   * @returns The updated content document.
   */
  @CsrfCheck(true)
  @Patch('/:id')
  async updateOne(
    @Body() contentDto: ContentUpdateDto,
    @Param('id') id: string,
  ): Promise<Content> {
    const contentType = await this.contentTypeService.findOne(
      contentDto.entity,
    );
    const newContent = this.filterDynamicFields(contentDto, contentType);
    const updatedContent = await this.contentService.updateOne(id, newContent);
    if (!updatedContent) {
      this.logger.warn(
        `Failed to update content with id ${id}. Content not found.`,
      );
      throw new NotFoundException(`Content of id ${id} not found`);
    }
    return updatedContent;
  }
}
