/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LabelGroup, LabelGroupFull } from '@hexabot-ai/types';
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

import {
  LabelGroupCreateDto,
  LabelGroupUpdateDto,
} from '../dto/label-group.dto';
import { LabelGroupOrmEntity } from '../entities/label-group.entity';
import { LabelGroupService } from '../services/label-group.service';

@Controller('labelgroup')
export class LabelGroupController extends BaseOrmController<LabelGroupOrmEntity> {
  constructor(private readonly labelGroupService: LabelGroupService) {
    super(labelGroupService);
  }

  /**
   * Returns the paginated and filtered label groups.
   * @returns A promise that resolves to an array of label groups.
   */
  @Get()
  async findLabelGroups(
    @Query(PopulatePipe)
    populate: string[],
    @Query(
      new TypeOrmSearchFilterPipe<LabelGroupOrmEntity>({
        allowedFields: ['name'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<LabelGroupOrmEntity>,
  ): Promise<LabelGroup[] | LabelGroupFull[]> {
    return await this.find(options, populate);
  }

  /**
   * Counts the filtered number of label groups.
   * @returns A promise that resolves to an object representing the filtered number of labels.
   */
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<LabelGroupOrmEntity>({
        allowedFields: ['name'],
      }),
    )
    options: FindManyOptions<LabelGroupOrmEntity> = {},
  ): Promise<{ count: number }> {
    return await this.count(options);
  }

  /**
   * Returns the label group by ID
   * @returns A promise that resolves to a label group.
   */
  @Get(':id')
  async findLabelGroup(
    @UuidParam('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<LabelGroup | LabelGroupFull> {
    return await this.findOne(id, populate);
  }

  /**
   * Creates a new label group
   * @returns A promise that resolves to the created label group.
   */
  @Post()
  async create(@Body() labelGroup: LabelGroupCreateDto): Promise<LabelGroup> {
    return await this.labelGroupService.create(labelGroup);
  }

  /**
   * Updates a label group by ID
   * @returns A promise that resolves to the created label group.
   */
  @Patch(':id')
  async updateOne(
    @UuidParam('id') id: string,
    @Body() labelGroupUpdate: LabelGroupUpdateDto,
  ): Promise<LabelGroup> {
    return await this.labelGroupService.updateOne(id, labelGroupUpdate);
  }

  /**
   * Deletes a label group by ID
   * @returns A promise that resolves to the label group deletion result.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteLabelGroup(@UuidParam('id') id: string): Promise<DeleteResult> {
    return await this.deleteOne(id);
  }

  /**
   * Deletes multiple label groups by their IDs.
   * @param ids - IDs of label groups to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteLabelGroups(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    return this.deleteMany(ids);
  }
}
