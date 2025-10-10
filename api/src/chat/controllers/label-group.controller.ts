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
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  LabelGroupCreateDto,
  LabelGroupUpdateDto,
} from '../dto/label-group.dto';
import { LabelGroup } from '../schemas/label-group.schema';
import { LabelGroupService } from '../services/label-group.service';

@Controller('labelgroup')
export class LabelGroupController extends BaseController<
  LabelGroup,
  LabelGroup,
  never,
  never
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
    @Query(PageQueryPipe) pageQuery: PageQueryDto<LabelGroup>,
    @Query(new SearchFilterPipe<LabelGroup>({ allowedFields: ['name'] }))
    filters: TFilterQuery<LabelGroup>,
  ) {
    return await this.labelGroupService.find(filters, pageQuery);
  }

  /**
   * Counts the filtered number of label groups.
   * @returns A promise that resolves to an object representing the filtered number of labels.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<LabelGroup>({
        allowedFields: ['name'],
      }),
    )
    filters?: TFilterQuery<LabelGroup>,
  ) {
    return await this.count(filters);
  }

  /**
   * Returns the label group by ID
   * @returns A promise that resolves to a label group.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.labelGroupService.findOne(id);
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
  async create(@Body() labelGroup: LabelGroupCreateDto) {
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
  ) {
    return await this.labelGroupService.updateOne(id, labelGroupUpdate);
  }

  /**
   * Deletes a label group by ID
   * @returns A promise that resolves to the label group deletion result.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
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
      _id: { $in: ids },
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
