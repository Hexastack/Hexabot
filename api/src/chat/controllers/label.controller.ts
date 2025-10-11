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
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';
import { TFilterQuery } from '@/utils/types/filter.types';

import { LabelCreateDto, LabelUpdateDto } from '../dto/label.dto';
import {
  Label,
  LabelFull,
  LabelPopulate,
  LabelStub,
} from '../schemas/label.schema';
import { LabelService } from '../services/label.service';

@Controller('label')
export class LabelController extends BaseController<
  Label,
  LabelStub,
  LabelPopulate,
  LabelFull
> {
  constructor(private readonly labelService: LabelService) {
    super(labelService);
  }

  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<Label>,
    @Query(PopulatePipe)
    populate: string[],
    @Query(new SearchFilterPipe<Label>({ allowedFields: ['name', 'title'] }))
    filters: TFilterQuery<Label>,
  ) {
    return this.canPopulate(populate)
      ? await this.labelService.findAndPopulate(filters, pageQuery)
      : await this.labelService.find(filters, pageQuery);
  }

  /**
   * Counts the filtered number of labels.
   * @returns A promise that resolves to an object representing the filtered number of labels.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<Label>({
        allowedFields: ['name', 'title'],
      }),
    )
    filters?: TFilterQuery<Label>,
  ) {
    return await this.count(filters);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[],
  ) {
    const doc = this.canPopulate(populate)
      ? await this.labelService.findOneAndPopulate(id)
      : await this.labelService.findOne(id);
    if (!doc) {
      this.logger.warn(`Unable to find Label by id ${id}`);
      throw new NotFoundException(`Label with ID ${id} not found`);
    }
    return doc;
  }

  @Post()
  async create(@Body() label: LabelCreateDto) {
    return await this.labelService.create(label);
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() labelUpdate: LabelUpdateDto,
  ) {
    return await this.labelService.updateOne(id, labelUpdate);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string) {
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
      _id: { $in: ids },
    });

    if (deleteResult.deletedCount === 0) {
      this.logger.warn(`Unable to delete Labels with provided IDs: ${ids}`);
      throw new NotFoundException('Labels with provided IDs not found');
    }

    this.logger.log(`Successfully deleted Labels with IDs: ${ids}`);
    return deleteResult;
  }
}
