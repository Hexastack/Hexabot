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
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  ContextVar,
  ContextVarCreateDto,
  ContextVarDtoConfig,
  ContextVarTransformerDto,
  ContextVarUpdateDto,
} from '../dto/context-var.dto';
import { ContextVarOrmEntity } from '../entities/context-var.entity';
import { ContextVarService } from '../services/context-var.service';

@Controller('contextvar')
export class ContextVarController extends BaseOrmController<
  ContextVarOrmEntity,
  ContextVarTransformerDto,
  ContextVarDtoConfig
> {
  constructor(private readonly contextVarService: ContextVarService) {
    super(contextVarService);
  }

  /** Finds context vars based on TypeORM filters and pagination options. */
  @Get()
  async findPage(
    @Query(
      new TypeOrmSearchFilterPipe<ContextVarOrmEntity>({
        allowedFields: ['label', 'name', 'permanent'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<ContextVarOrmEntity>,
  ): Promise<ContextVar[]> {
    return await this.contextVarService.find(options ?? {});
  }

  /** Counts context vars matching the provided TypeORM options. */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<ContextVarOrmEntity>({
        allowedFields: ['label', 'name', 'permanent'],
      }),
    )
    options?: FindManyOptions<ContextVarOrmEntity>,
  ) {
    return await this.count(options ?? {});
  }

  /**
   * Retrieves a contextVar by its ID.
   * @param id - The ID of the contextVar to retrieve.
   * @returns A Promise that resolves to the retrieved contextVar.
   */

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ContextVar> {
    const doc = await this.contextVarService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find ContextVar by id ${id}`);
      throw new NotFoundException(`ContextVar with ID ${id} not found`);
    }
    return doc;
  }

  /**
   * Creates a new contextVar.
   * @param contextVar - The data of the contextVar to create.
   * @returns A Promise that resolves to the created contextVar.
   */
  @Post()
  async create(@Body() contextVar: ContextVarCreateDto): Promise<ContextVar> {
    return await this.contextVarService.create(contextVar);
  }

  /**
   * Updates an existing contextVar.
   * @param id - The ID of the contextVar to update.
   * @param contextVarUpdate - The updated data for the contextVar.
   * @returns A Promise that resolves to the updated contextVar.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() contextVarUpdate: ContextVarUpdateDto,
  ): Promise<ContextVar> {
    return await this.contextVarService.updateOne(id, contextVarUpdate);
  }

  /**
   * Deletes a contextVar.
   * @param id - The ID of the contextVar to delete.
   * @returns A Promise that resolves to a DeleteResult.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.contextVarService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete ContextVar by id ${id}`);
      throw new NotFoundException(`ContextVar with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes multiple context variables by their IDs.
   * @param ids - IDs of context variables to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.contextVarService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(
        `Unable to delete context vars with provided IDs: ${ids}`,
      );
      throw new NotFoundException('Context vars with provided IDs not found');
    }

    this.logger.log(`Successfully deleted context vars with IDs: ${ids}`);
    return deleteResult;
  }
}
