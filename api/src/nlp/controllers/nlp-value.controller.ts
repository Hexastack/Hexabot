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
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';
import { Format } from '@/utils/types/format.types';

import { NlpValueCreateDto, NlpValueUpdateDto } from '../dto/nlp-value.dto';
import {
  NlpValue,
  NlpValueFull,
  NlpValuePopulate,
  NlpValueStub,
} from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

@Controller('nlpvalue')
export class NlpValueController extends BaseController<
  NlpValue,
  NlpValueStub,
  NlpValuePopulate,
  NlpValueFull
> {
  constructor(
    private readonly nlpValueService: NlpValueService,
    private readonly nlpEntityService: NlpEntityService,
  ) {
    super(nlpValueService);
  }

  /**
   * Creates a new NLP value.
   *
   * Validates the input DTO and ensures the entity ID exists.
   *
   * @param createNlpValueDto - Data transfer object for creating NLP values.
   *
   * @returns A promise resolving to the created NLP value.
   */

  @Post()
  async create(
    @Body() createNlpValueDto: NlpValueCreateDto,
  ): Promise<NlpValue> {
    const nlpEntity = createNlpValueDto.entity
      ? await this.nlpEntityService.findOne(createNlpValueDto.entity!)
      : null;

    this.validate({
      dto: createNlpValueDto,
      allowedIds: {
        entity: nlpEntity?.id,
      },
    });

    return await this.nlpValueService.create(createNlpValueDto);
  }

  /**
   * Retrieves the filtered count of NLP values.
   *
   * This endpoint supports filtering based on allowed fields.
   *
   * @returns A promise resolving to an object representing the count of filtered NLP values.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<NlpValue>({
        allowedFields: ['entity', 'value', 'doc'],
      }),
    )
    filters?: TFilterQuery<NlpValue>,
  ) {
    return await this.count(filters);
  }

  /**
   * Finds a single NLP value by ID.
   *
   * Optionally populates related entities based on query parameters.
   *
   * @param id - The ID of the NLP value to retrieve.
   * @param populate - An array of related entities to populate.
   *
   * @returns A promise resolving to the found NLP value.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe) populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.nlpValueService.findOneAndPopulate(id)
      : await this.nlpValueService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find NLP Value by id ${id}`);
      throw new NotFoundException(`NLP Value with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Retrieves a paginated list of NLP values with NLP Samples count.
   *
   * Supports filtering, pagination, and optional population of related entities.
   *
   * @param pageQuery - The pagination query parameters.
   * @param populate - An array of related entities to populate.
   * @param filters - Filters to apply when retrieving the NLP values.
   *
   * @returns A promise resolving to a paginated list of NLP values with NLP Samples count.
   */
  @Get()
  async findWithCount(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<NlpValue>,
    @Query(PopulatePipe) populate: string[],
    @Query(
      new SearchFilterPipe<NlpValue>({
        allowedFields: ['entity', 'value', 'doc'],
      }),
    )
    filters: TFilterQuery<NlpValue>,
  ) {
    return await this.nlpValueService.findWithCount(
      this.canPopulate(populate) ? Format.FULL : Format.STUB,
      pageQuery,
      filters,
    );
  }

  /**
   * Updates an existing NLP value by ID.
   *
   * Validates the input DTO and ensures the NLP value with the specified ID exists.
   *
   * @param id - The ID of the NLP value to update.
   * @param updateNlpValueDto - Data transfer object for updating NLP values.
   *
   * @returns A promise resolving to the updated NLP value.
   */

  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() updateNlpValueDto: NlpValueUpdateDto,
  ): Promise<NlpValue> {
    const nlpEntity = updateNlpValueDto.entity
      ? await this.nlpEntityService.findOne(updateNlpValueDto.entity!)
      : null;

    this.validate({
      dto: updateNlpValueDto,
      allowedIds: {
        entity: nlpEntity?.id,
      },
    });

    return await this.nlpValueService.updateOne(id, updateNlpValueDto);
  }

  /**
   * Deletes an NLP value by ID.
   *
   * Ensures that the NLP value with the specified ID exists before deletion.
   *
   * @param id - The ID of the NLP value to delete.
   *
   * @returns A promise resolving to the result of the deletion operation.
   */

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const result = await this.nlpValueService.deleteCascadeOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete NLP Value by id ${id}`);
      throw new NotFoundException(`NLP Value with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes multiple NLP values by their IDs.
   * @param ids - IDs of NLP values to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */

  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.nlpValueService.deleteMany({
      _id: { $in: ids },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete NLP values with provided IDs: ${ids}`);
      throw new NotFoundException('NLP values with provided IDs not found');
    }

    this.logger.log(`Successfully deleted NLP values with IDs: ${ids}`);
    return deleteResult;
  }
}
