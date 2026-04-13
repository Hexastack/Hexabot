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
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions, In } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  MemoryDefinition,
  MemoryDefinitionCreateDto,
  MemoryDefinitionUpdateDto,
} from '../dto/memory-definition.dto';
import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';
import { MemoryDefinitionService } from '../services/memory-definition.service';

@Controller('memorydefinition')
export class MemoryDefinitionController extends BaseOrmController<MemoryDefinitionOrmEntity> {
  constructor(
    private readonly memoryDefinitionService: MemoryDefinitionService,
  ) {
    super(memoryDefinitionService);
  }

  /**
   * Creates a new memory definition.
   *
   * @param memoryDefinitionDto - The data transfer object containing the memory definition.
   *
   * @returns The created memory definition.
   */
  @Post()
  async create(
    @Body() memoryDefinitionDto: MemoryDefinitionCreateDto,
  ): Promise<MemoryDefinition> {
    return await this.memoryDefinitionService.create(memoryDefinitionDto);
  }

  /**
   * Retrieves memory definitions matching the provided filters.
   *
   * @param options - Combined filters, pagination, and sorting for the query.
   *
   * @returns Memory definitions matching the provided options.
   */
  @Get()
  async find(
    @Query(
      new TypeOrmSearchFilterPipe<MemoryDefinitionOrmEntity>({
        allowedFields: ['name', 'slug', 'scope', 'ttlSeconds'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<MemoryDefinitionOrmEntity> = {},
  ) {
    return await this.memoryDefinitionService.find(options ?? {});
  }

  /**
   * Counts the number of memory definitions matching the provided filters.
   *
   * @param options - Filters applied to the count query.
   *
   * @returns The count of memory definitions matching the filters.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<MemoryDefinitionOrmEntity>({
        allowedFields: ['name', 'slug', 'scope', 'ttlSeconds'],
      }),
    )
    options?: FindManyOptions<MemoryDefinitionOrmEntity>,
  ) {
    return await this.count(options ?? {});
  }

  /**
   * Retrieves a single memory definition by its ID.
   *
   * @param id - The ID of the memory definition to retrieve.
   *
   * @returns The memory definition matching the provided ID.
   */
  @Get(':id')
  async findOne(@UuidParam('id') id: string): Promise<MemoryDefinition> {
    const record = await this.memoryDefinitionService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find Memory Definition by id ${id}`);
      throw new NotFoundException(`Memory Definition with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Updates a memory definition by its ID.
   *
   * @param id - The ID of the memory definition to update.
   * @param memoryDefinitionUpdate - The data transfer object containing updates.
   *
   * @returns The updated memory definition.
   */
  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() memoryDefinitionUpdate: MemoryDefinitionUpdateDto,
  ): Promise<MemoryDefinition> {
    const record = await this.memoryDefinitionService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to update Memory Definition by id ${id}`);
      throw new NotFoundException(`Memory Definition with ID ${id} not found`);
    }

    return await this.memoryDefinitionService.updateOne(
      id,
      memoryDefinitionUpdate,
    );
  }

  /**
   * Deletes a memory definition by its ID.
   *
   * @param id - The ID of the memory definition to delete.
   *
   * @returns The result of the delete operation.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@UuidParam('id') id: string): Promise<DeleteResult> {
    const result = await this.memoryDefinitionService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Memory Definition by id ${id}`);
      throw new NotFoundException(`Memory Definition with ID ${id} not found`);
    }

    return result;
  }

  /**
   * Deletes multiple memory definitions by their IDs.
   *
   * @param ids - IDs of memory definitions to be deleted.
   *
   * @returns The result of the deletion operation.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }

    const deleteResult = await this.memoryDefinitionService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(
        `Unable to delete Memory Definitions with provided IDs: ${ids}`,
      );
      throw new NotFoundException(
        'Memory Definitions with provided IDs not found',
      );
    }

    this.logger.log(`Successfully deleted Memory Definitions with IDs: ${ids}`);

    return deleteResult;
  }
}
