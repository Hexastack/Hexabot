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
  Param,
  Post,
  Patch,
  HttpCode,
  Query,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import { NlpValueCreateDto, NlpValueUpdateDto } from '../dto/nlp-value.dto';
import { NlpValue, NlpValueStub } from '../schemas/nlp-value.schema';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

@UseInterceptors(CsrfInterceptor)
@Controller('nlpvalue')
export class NlpValueController extends BaseController<NlpValue, NlpValueStub> {
  constructor(
    private readonly nlpValueService: NlpValueService,
    private readonly nlpEntityService: NlpEntityService,
    private readonly logger: LoggerService,
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
  @CsrfCheck(true)
  @Post()
  async create(
    @Body() createNlpValueDto: NlpValueCreateDto,
  ): Promise<NlpValue> {
    this.validate({
      dto: createNlpValueDto,
      allowedIds: {
        entity: (await this.nlpEntityService.findOne(createNlpValueDto.entity))
          ?.id,
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
      new SearchFilterPipe<NlpValue>({ allowedFields: ['entity', 'value'] }),
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
    const doc = this.canPopulate(populate, ['entity'])
      ? await this.nlpValueService.findOneAndPopulate(id)
      : await this.nlpValueService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find NLP Value by id ${id}`);
      throw new NotFoundException(`NLP Value with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Retrieves a paginated list of NLP values.
   *
   * Supports filtering, pagination, and optional population of related entities.
   *
   * @param pageQuery - The pagination query parameters.
   * @param populate - An array of related entities to populate.
   * @param filters - Filters to apply when retrieving the NLP values.
   *
   * @returns A promise resolving to a paginated list of NLP values.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<NlpValue>,
    @Query(PopulatePipe) populate: string[],
    @Query(
      new SearchFilterPipe<NlpValue>({
        allowedFields: ['entity', 'value'],
      }),
    )
    filters: TFilterQuery<NlpValue>,
  ) {
    return this.canPopulate(populate, ['entity'])
      ? await this.nlpValueService.findPageAndPopulate(filters, pageQuery)
      : await this.nlpValueService.findPage(filters, pageQuery);
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
  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() updateNlpValueDto: NlpValueUpdateDto,
  ): Promise<NlpValue> {
    const result = await this.nlpValueService.updateOne(id, updateNlpValueDto);
    if (!result) {
      this.logger.warn(`Unable to update NLP Value by id ${id}`);
      throw new NotFoundException(`NLP Value with ID ${id} not found`);
    }
    return result;
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
  @CsrfCheck(true)
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
}
