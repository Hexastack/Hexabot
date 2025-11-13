/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmController, DeleteResult } from '@hexabot/core/database';
import { PopulatePipe, TypeOrmSearchFilterPipe } from '@hexabot/core/pipes';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  MethodNotAllowedException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';

import {
  NlpEntity,
  NlpEntityCreateDto,
  NlpEntityDtoConfig,
  NlpEntityTransformerDto,
  NlpEntityUpdateDto,
} from '../dto/nlp-entity.dto';
import { NlpEntityOrmEntity } from '../entities/nlp-entity.entity';
import { NlpEntityService } from '../services/nlp-entity.service';

@Controller('nlpentity')
export class NlpEntityController extends BaseOrmController<
  NlpEntityOrmEntity,
  NlpEntityTransformerDto,
  NlpEntityDtoConfig
> {
  constructor(private readonly nlpEntityService: NlpEntityService) {
    super(nlpEntityService);
  }

  /**
   * Creates a new NLP entity.
   *
   * This endpoint receives the NLP entity data in the request body, validates it, and creates a new entry in the database.
   *
   * @param createNlpEntityDto - Data transfer object containing the details of the NLP entity to create.
   *
   * @returns The newly created NLP entity.
   */
  @Post()
  async create(
    @Body() createNlpEntityDto: NlpEntityCreateDto,
  ): Promise<NlpEntity> {
    return await this.nlpEntityService.create(createNlpEntityDto);
  }

  /**
   * Counts the number of NLP entities based on provided filters.
   *
   * This endpoint allows users to apply filters to count the number of entities in the system that match specific criteria.
   *
   * @param options - Optional query options to apply when counting entities.
   *
   * @returns The count of NLP entities matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<NlpEntityOrmEntity>({
        allowedFields: ['name', 'doc'],
      }),
    )
    options?: FindManyOptions<NlpEntityOrmEntity>,
  ) {
    return await super.count(options);
  }

  /**
   * Finds a single NLP entity by ID.
   *
   * This endpoint returns an NLP entity if found by its ID, optionally allowing population of specified fields.
   *
   * @param id - The ID of the NLP entity to find.
   * @param populate - Fields to populate, such as 'values'.
   *
   * @returns The NLP entity found by the ID.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe) populate: string[],
  ) {
    const record = this.canPopulate(populate)
      ? await this.nlpEntityService.findOneAndPopulate(id)
      : await this.nlpEntityService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find NLP Entity by id ${id}`);
      throw new NotFoundException(`NLP Entity with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Retrieves a paginated list of NLP entities with optional filters.
   *
   * This endpoint supports pagination and allows users to retrieve a filtered list of NLP entities.
   *
   * @param populate - Fields to populate in the retrieved entities.
   * @param options - Combined filters, pagination, and sorting for the query.
   *
   * @returns A paginated list of NLP entities.
   */
  @Get()
  async findPage(
    @Query(PopulatePipe) populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<NlpEntityOrmEntity>({
        allowedFields: ['name', 'doc'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<NlpEntityOrmEntity>,
  ) {
    return this.canPopulate(populate)
      ? await this.nlpEntityService.findAndPopulate(options)
      : await this.nlpEntityService.find(options);
  }

  /**
   * Updates an NLP entity by ID.
   *
   * This endpoint allows updating an existing NLP entity. The entity must not be a built-in entity.
   *
   * @param id - The ID of the NLP entity to update.
   * @param nlpEntityDto - The new data for the NLP entity.
   *
   * @returns The updated NLP entity.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() nlpEntityDto: NlpEntityUpdateDto,
  ): Promise<NlpEntity> {
    const nlpEntity = await this.nlpEntityService.findOne(id);
    if (!nlpEntity) {
      this.logger.warn(`Unable to update NLP Entity by id ${id}`);
      throw new NotFoundException(`NLP Entity with ID ${id} not found`);
    }

    if (nlpEntity.builtin) {
      if (nlpEntityDto.weight) {
        // Only allow weight update for builtin entities
        return await this.nlpEntityService.updateWeight(
          id,
          nlpEntityDto.weight,
        );
      } else {
        throw new ConflictException(
          `Cannot update builtin NLP Entity ${nlpEntity.name} except for weight`,
        );
      }
    }

    return await this.nlpEntityService.updateOne(id, nlpEntityDto);
  }

  /**
   * Deletes an NLP entity by ID.
   *
   * This endpoint deletes an NLP entity from the system, provided it is not a built-in entity.
   *
   * @param id - The ID of the NLP entity to delete.
   *
   * @returns The result of the deletion operation.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
    const nlpEntity = await this.nlpEntityService.findOne(id);
    if (!nlpEntity) {
      this.logger.warn(`Unable to delete NLP Entity by id ${id}`);
      throw new NotFoundException(`NLP Entity with ID ${id} not found`);
    }
    if (nlpEntity.builtin) {
      throw new MethodNotAllowedException(
        `Cannot delete builtin NLP Entity ${nlpEntity.name}`,
      );
    }

    const result = await this.nlpEntityService.deleteCascadeOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Failed to delete NLP Entity by id ${id}`);
      throw new InternalServerErrorException(
        `Failed to delete NLP Entity with ID ${id}`,
      );
    }

    return result;
  }

  /**
   * Deletes multiple NLP entities by their IDs.
   * @param ids - IDs of NLP entities to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }

    const deleteResult = await this.nlpEntityService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(
        `Unable to delete NLP entities with provided IDs: ${ids}`,
      );
      throw new NotFoundException('NLP entities with provided IDs not found');
    }

    this.logger.log(`Successfully deleted NLP entities with IDs: ${ids}`);

    return deleteResult;
  }
}
