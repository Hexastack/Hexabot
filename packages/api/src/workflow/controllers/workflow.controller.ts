/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Workflow,
  WorkflowDtoConfig,
  WorkflowFull,
  WorkflowNewDto,
  WorkflowTransformerDto,
  WorkflowUpdateDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowService } from '../services/workflow.service';

@Controller('workflow')
export class WorkflowController extends BaseOrmController<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig
> {
  constructor(private readonly workflowService: WorkflowService) {
    super(workflowService);
  }

  /**
   * Creates a new workflow definition.
   *
   * @param workflowCreateDto - Workflow properties and definition to persist.
   *
   * @returns The newly created workflow.
   */
  @Post()
  async create(
    @Body() workflowCreateDto: WorkflowNewDto,
    @Req() req: Request,
  ): Promise<Workflow> {
    return await this.workflowService.create({
      ...workflowCreateDto,
      createdBy: req.session?.passport?.user?.id,
    });
  }

  /**
   * Retrieves workflows matching the provided filters.
   *
   * @param options - Combined filters, pagination, and sorting for the query.
   *
   * @returns Workflows that satisfy the provided options.
   */
  @Get()
  async findMany(
    @Query(
      new TypeOrmSearchFilterPipe<WorkflowOrmEntity>({
        allowedFields: ['name', 'version', 'description', 'createdBy.id'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<WorkflowOrmEntity> = {},
    @Query(PopulatePipe)
    populate: string[] = [],
  ) {
    return this.canPopulate(populate)
      ? await this.workflowService.findAndPopulate(options ?? {})
      : await this.workflowService.find(options ?? {});
  }

  /**
   * Finds a single workflow by its identifier.
   *
   * @param id - The workflow ID.
   *
   * @returns The workflow matching the provided ID.
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query(PopulatePipe)
    populate: string[] = [],
  ): Promise<Workflow | WorkflowFull> {
    const workflow = this.canPopulate(populate)
      ? await this.workflowService.findOneAndPopulate(id)
      : await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to find Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow;
  }

  /**
   * Updates an existing workflow definition.
   *
   * @param id - The workflow ID to update.
   * @param workflowUpdateDto - Partial workflow attributes to apply.
   *
   * @returns The updated workflow definition.
   */
  @Patch(':id')
  async updateOne(
    @Param('id') id: string,
    @Body() workflowUpdateDto: WorkflowUpdateDto,
  ): Promise<Workflow> {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to update Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return await this.workflowService.updateOne(id, workflowUpdateDto);
  }

  /**
   * Deletes a workflow definition.
   *
   * @param id - The workflow ID to delete.
   *
   * @returns Deletion result indicating how many records were removed.
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteOne(@Param('id') id: string): Promise<DeleteResult> {
    const result = await this.workflowService.deleteOne(id);
    if (result.deletedCount === 0) {
      this.logger.warn(`Unable to delete Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return result;
  }
}
