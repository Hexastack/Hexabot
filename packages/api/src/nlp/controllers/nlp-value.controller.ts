/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
import { FindManyOptions, In } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';
import { Format } from '@/utils/types/format.types';

import {
  NlpValue,
  NlpValueCreateDto,
  NlpValueDtoConfig,
  NlpValueTransformerDto,
  NlpValueUpdateDto,
} from '../dto/nlp-value.dto';
import { NlpValueOrmEntity } from '../entities/nlp-value.entity';
import { NlpEntityService } from '../services/nlp-entity.service';
import { NlpValueService } from '../services/nlp-value.service';

@Controller('nlpvalue')
export class NlpValueController extends BaseOrmController<
  NlpValueOrmEntity,
  NlpValueTransformerDto,
  NlpValueDtoConfig,
  NlpValue
> {
  constructor(
    protected readonly nlpValueService: NlpValueService,
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
        entityId: nlpEntity?.id,
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
      new TypeOrmSearchFilterPipe<NlpValueOrmEntity>({
        allowedFields: ['entity.id', 'value', 'doc'],
      }),
    )
    options: FindManyOptions<NlpValueOrmEntity> = {},
  ) {
    return await this.count(options);
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
    const result = this.canPopulate(populate)
      ? await this.nlpValueService.findOneAndPopulate(id)
      : await this.nlpValueService.findOne(id);
    if (!result) {
      this.logger.warn(`Unable to find NLP Value by id ${id}`);
      throw new NotFoundException(`NLP Value with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Retrieves a paginated list of NLP values with NLP Samples count.
   *
   * Supports filtering, pagination, and optional population of related entities.
   *
   * @param populate - An array of related entities to populate.
   * @param options - TypeORM find options for filtering, sorting, and pagination.
   *
   * @returns A promise resolving to a paginated list of NLP values with NLP Samples count.
   */
  @Get()
  async findWithCount(
    @Query(PopulatePipe) populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<NlpValueOrmEntity>({
        allowedFields: ['entity.id', 'value', 'doc'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<NlpValueOrmEntity> = {},
  ) {
    return await this.nlpValueService.findWithCount(
      this.canPopulate(populate) ? Format.FULL : Format.STUB,
      options,
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

    const dtoToValidate = {
      ...updateNlpValueDto,
      entityId: updateNlpValueDto.entity,
    };

    this.validate({
      dto: dtoToValidate,
      allowedIds: {
        entityId: nlpEntity?.id,
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
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete NLP values with provided IDs: ${ids}`);
      throw new NotFoundException('NLP values with provided IDs not found');
    }

    this.logger.log(`Successfully deleted NLP values with IDs: ${ids}`);
    return deleteResult;
  }
}
