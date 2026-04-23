/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Label, LabelFull } from '@hexabot-ai/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FindManyOptions } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import { LabelCreateDto, LabelUpdateDto } from '../dto/label.dto';
import { LabelOrmEntity } from '../entities/label.entity';
import { LabelService } from '../services/label.service';

@Controller('label')
export class LabelController extends BaseOrmController<LabelOrmEntity> {
  constructor(private readonly labelService: LabelService) {
    super(labelService);
  }

  @Get()
  async findLabels(
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
    return await this.find(options, populate);
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
    options: FindManyOptions<LabelOrmEntity> = {},
  ): Promise<{ count: number }> {
    return await this.count(options);
  }

  @Get(':id')
  async findLabel(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<Label | LabelFull> {
    return this.findOne(id, populate);
  }

  @Post()
  async create(@Body() label: LabelCreateDto): Promise<Label> {
    return await this.labelService.create(label);
  }

  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() labelUpdate: LabelUpdateDto,
  ): Promise<Label> {
    return await this.labelService.updateOne(id, labelUpdate);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteLabel(@UuidParam('id') id: string): Promise<DeleteResult> {
    return await this.deleteOne(id);
  }

  /**
   * Deletes multiple Labels by their IDs.
   * @param ids - IDs of Labels to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteLabels(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    return this.deleteMany(ids);
  }
}
