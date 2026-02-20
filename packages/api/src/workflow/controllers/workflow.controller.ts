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
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { ActionService } from '@/actions';
import { UserService } from '@/user';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { DeleteResult } from '@/utils/generics/base-orm.repository';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';

import {
  Workflow,
  WorkflowCreateDto,
  WorkflowDtoConfig,
  WorkflowFull,
  WorkflowUpdateDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import {
  ManualEventWrapper,
  ScheduledEventWrapper,
} from '../lib/trigger-event-wrapper';
import { AgenticService } from '../services/agentic.service';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowType } from '../types';

@Controller('workflow')
export class WorkflowController extends BaseOrmController<
  WorkflowOrmEntity,
  WorkflowDtoConfig
> {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly agenticService: AgenticService,
    private readonly userService: UserService,
    private readonly actionService: ActionService,
  ) {
    super(workflowService);
  }

  /**
   * Creates a new workflow.
   *
   * @param workflowCreateDto - Workflow properties object to persist.
   *
   * @returns The newly created workflow.
   */
  @Post()
  async create(
    @Body() workflowCreateDto: WorkflowCreateDto,
    @Req() req: Request,
  ): Promise<Workflow> {
    const userId = req.session?.passport?.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Only authenticated users can create workflows',
      );
    }

    return await this.workflowService.create({
      ...workflowCreateDto,
      createdBy: userId,
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
        allowedFields: [
          'name',
          'description',
          'type',
          'schedule',
          'createdBy.id',
        ],
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
   * Retrieves actions with JSON schemas for input, output, and settings,
   * optionally filtered by workflow type.
   *
   * @param type - Optional workflow type to filter actions.
   *
   * @returns Action metadata with JSON schemas.
   */
  @Get('actions{/:type}')
  findActions(@Param('type') type?: WorkflowType) {
    if (type && !Object.values(WorkflowType).includes(type)) {
      throw new BadRequestException(`Invalid workflow type "${type}"`);
    }

    return this.actionService.getAllSchemaDefinitions(type);
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
   * @param workflowUpdateDto - Partial workflow attributes (including definition) to apply.
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

  /**
   * Manually triggers a workflow run for manual or scheduled workflows.
   *
   * @param id - The workflow ID to execute.
   * @param input - Optional workflow input payload (manual workflows only).
   * @param req - Express request containing the authenticated session.
   */
  @Post(':id/run')
  @HttpCode(202)
  async runManually(
    @Param('id') id: string,
    @Body('input') input: unknown = {},
    @Req() req: Request,
  ): Promise<{ accepted: true }> {
    const userId = req.session?.passport?.user?.id;
    if (!userId) {
      throw new UnauthorizedException(
        'Only authenticated users can run workflows manually',
      );
    }

    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to run Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    if (
      workflow.type !== WorkflowType.manual &&
      workflow.type !== WorkflowType.scheduled
    ) {
      throw new BadRequestException(
        'Workflow must be manual or scheduled to run manually',
      );
    }

    const manualInput =
      workflow.type === WorkflowType.manual
        ? this.workflowService.validateManualInput(
            input ?? {},
            workflow.inputSchema,
          )
        : {};
    const event =
      workflow.type === WorkflowType.scheduled
        ? new ScheduledEventWrapper({
            schedule: workflow.schedule ?? null,
            triggeredAt: new Date(),
          })
        : new ManualEventWrapper(manualInput, userId);
    const initiator = await this.userService.findOne(userId);
    event.setInitiator(initiator!);

    await this.agenticService.handleEvent(event, workflow);

    return { accepted: true };
  }
}
