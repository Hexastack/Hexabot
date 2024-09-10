/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
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
import { TFilterQuery } from 'mongoose';

import { CsrfInterceptor } from '@/interceptors/csrf.interceptor';
import { LoggerService } from '@/logger/logger.service';
import { BaseController } from '@/utils/generics/base-controller';
import { DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { PageQueryPipe } from '@/utils/pagination/pagination-query.pipe';
import { SearchFilterPipe } from '@/utils/pipes/search-filter.pipe';

import {
  ContextVarCreateDto,
  ContextVarUpdateDto,
} from '../dto/context-var.dto';
import { ContextVar } from '../schemas/context-var.schema';
import { ContextVarService } from '../services/context-var.service';

@UseInterceptors(CsrfInterceptor)
@Controller('contextvar')
export class ContextVarController extends BaseController<ContextVar> {
  constructor(
    private readonly contextVarService: ContextVarService,
    private readonly logger: LoggerService,
  ) {
    super(contextVarService);
  }

  /**
   * Finds a page of contextVars based on specified filters and pagination parameters.
   * @param pageQuery - The pagination parameters.
   * @param filters - The filters to apply.
   * @returns A Promise that resolves to an array of contextVars.
   */
  @Get()
  async findPage(
    @Query(PageQueryPipe) pageQuery: PageQueryDto<ContextVar>,
    @Query(new SearchFilterPipe<ContextVar>({ allowedFields: ['label'] }))
    filters: TFilterQuery<ContextVar>,
  ): Promise<ContextVar[]> {
    return await this.contextVarService.findPage(filters, pageQuery);
  }

  /**
   * Counts the filtered number of contextVars.
   * @returns A promise that resolves to an object representing the filtered number of contextVars.
   */
  @Get('count')
  async filterCount(
    @Query(
      new SearchFilterPipe<ContextVar>({
        allowedFields: ['label'],
      }),
    )
    filters?: TFilterQuery<ContextVar>,
  ) {
    return await this.count(filters);
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

  @CsrfCheck(true)
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

  @CsrfCheck(true)
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() contextVarUpdate: ContextVarUpdateDto,
  ): Promise<ContextVar> {
    const result = await this.contextVarService.updateOne(id, contextVarUpdate);
    if (!result) {
      this.logger.warn(`Unable to update ContextVar by id ${id}`);
      throw new NotFoundException(`ContextVar with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Deletes a contextVar.
   * @param id - The ID of the contextVar to delete.
   * @returns A Promise that resolves to a DeleteResult.
   */

  @CsrfCheck(true)
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
}
