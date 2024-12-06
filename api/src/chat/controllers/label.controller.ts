/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
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
  UseInterceptors,
} from '@nestjs/common';
import { CsrfCheck } from '@tekuconcept/nestjs-csrf';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
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

@UseInterceptors(CsrfInterceptor)
@Controller('label')
export class LabelController extends BaseController<
  Label,
  LabelStub,
  LabelPopulate,
  LabelFull
> {
  constructor(
    private readonly labelService: LabelService,
    private readonly logger: LoggerService,
  ) {
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

  @CsrfCheck(true)
  @Post()
  async create(@Body() label: LabelCreateDto) {
    return await this.labelService.create(label);
  }

  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() labelUpdate: LabelUpdateDto,
  ) {
    const result = await this.labelService.updateOne(id, labelUpdate);
    if (!result) {
      this.logger.warn(`Unable to update Label by id ${id}`);
      throw new NotFoundException(`Label with ID ${id} not found`);
    }
    return result;
  }

  @CsrfCheck(true)
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
}
