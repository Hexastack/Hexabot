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
  LabelGroup,
  LabelGroupCreateDto,
  LabelGroupDtoConfig,
  LabelGroupFull,
  LabelGroupTransformerDto,
  LabelGroupUpdateDto,
} from '../dto/label-group.dto';
import { LabelGroupOrmEntity } from '../entities/label-group.entity';
import { LabelGroupService } from '../services/label-group.service';

@Controller('labelgroup')
export class LabelGroupController extends BaseOrmController<
  LabelGroupOrmEntity,
  LabelGroupTransformerDto,
  LabelGroupDtoConfig
> {
  constructor(private readonly labelGroupService: LabelGroupService) {
    super(labelGroupService);
  }

  /**
   * Returns the paginated and filtered label groups.
   * @returns A promise that resolves to an array of label groups.
   */
  @Get()
  async findPage(
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
    const queryOptions = options ?? {};
    return this.canPopulate(populate)
      ? await this.labelGroupService.findAndPopulate(queryOptions)
      : await this.labelGroupService.find(queryOptions);
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
    options?: FindManyOptions<LabelGroupOrmEntity>,
  ): Promise<{ count: number }> {
    return await this.count(options ?? {});
  }

  /**
   * Returns the label group by ID
   * @returns A promise that resolves to a label group.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ): Promise<LabelGroup | LabelGroupFull> {
    const doc = this.canPopulate(populate)
      ? await this.labelGroupService.findOneAndPopulate(id)
      : await this.labelGroupService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Label Group by id ${id}`);
      throw new NotFoundException(`Label Group with ID ${id} not found`);
    }
    return doc;
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
    @Param('id') id: string,
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
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.labelGroupService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Label Group by id ${id}`);
      throw new NotFoundException(`Label Group with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes multiple label groups by their IDs.
   * @param ids - IDs of label groups to be deleted.
   * @returns A Promise that resolves to the deletion result.
   */
  @Delete('')
  @HttpCode(204)
  async deleteMany(@Body('ids') ids?: string[]): Promise<DeleteResult> {
    if (!ids?.length) {
      throw new BadRequestException('No IDs provided for deletion.');
    }
    const deleteResult = await this.labelGroupService.deleteMany({
      where: { id: In(ids) },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(
        `Unable to delete Label Groups with provided IDs: ${ids}`,
      );
      throw new NotFoundException('Label Groups with provided IDs not found');
    }

    this.logger.log(`Successfully deleted Label Groups with IDs: ${ids}`);
    return deleteResult;
  }
}
