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

import {
  Label,
  LabelCreateDto,
  LabelDtoConfig,
  LabelFull,
  LabelTransformerDto,
  LabelUpdateDto,
} from '../dto/label.dto';
import { LabelOrmEntity } from '../entities/label.entity';
import { LabelService } from '../services/label.service';

@Controller('label')
export class LabelController extends BaseOrmController<
  LabelOrmEntity,
  LabelTransformerDto,
  LabelDtoConfig
> {
  constructor(private readonly labelService: LabelService) {
    super(labelService);
  }

  @Get()
  async findPage(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<LabelOrmEntity>({
        allowedFields: ['name', 'title', 'builtin'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<LabelOrmEntity>,
  ): Promise<Label[] | LabelFull[]> {
    const queryOptions = options ?? {};

    return this.canPopulate(populate)
      ? await this.labelService.findAndPopulate(queryOptions)
      : await this.labelService.find(queryOptions);
  }

  /**
   * Counts the filtered number of labels.
   * @returns A promise that resolves to an object representing the filtered number of labels.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<LabelOrmEntity>({
        allowedFields: ['name', 'title', 'builtin', 'group.id'],
      }),
    )
    options?: FindManyOptions<LabelOrmEntity>,
  ): Promise<{ count: number }> {
    return await this.count(options ?? {});
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Label | LabelFull> {
    const record = this.canPopulate(populate)
      ? await this.labelService.findOneAndPopulate(id)
      : await this.labelService.findOne(id);
    if (!record) {
      this.logger.warn(`Unable to find Label by id ${id}`);
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return record;
  }

  @Post()
  async create(@Body() label: LabelCreateDto): Promise<Label> {
    return await this.labelService.create(label);
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() labelUpdate: LabelUpdateDto,
  ): Promise<Label> {
    return await this.labelService.updateOne(id, labelUpdate);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.labelService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Label by id ${id}`);
      throw new NotFoundException(`Label with ID ${id} not found`);
    }

    return result;
  }

  /**
   * Deletes multiple Labels by their IDs.
   * @param ids - IDs of Labels to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.labelService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete Labels with provided IDs: ${ids}`);
      throw new NotFoundException('Labels with provided IDs not found');
    }

    this.logger.log(`Successfully deleted Labels with IDs: ${ids}`);

    return deleteResult;
  }
}
