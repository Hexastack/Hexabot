/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { FindManyOptions } from 'typeorm';

import { TypeOrmSearchFilterPipe } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { PopulatePipe } from '@/utils/pipes/populate.pipe';

import {
  WorkflowNewVersionDto,
  WorkflowVersion,
  WorkflowVersionDtoConfig,
} from '../dto/workflow-version.dto';
import { WorkflowVersionOrmEntity } from '../entities/workflow-version.entity';
import { WorkflowVersionService } from '../services/workflow-version.service';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowVersionAction } from '../types';

@Controller('workflow')
export class WorkflowVersionController extends BaseOrmController<
  WorkflowVersionOrmEntity,
  WorkflowVersionDtoConfig
> {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowVersionService: WorkflowVersionService,
  ) {
    super(workflowVersionService);
  }

  /**
   * Counts the versions.
   *
   * @returns A promise that resolves to an object representing the total number of versions.
   */
  @Get(':id/versions/count')
  async countAll(@Param('id') id: string) {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to find Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return await super.count({ where: { workflow: { id } } });
  }

  /**
   * Creates a new workflow definition version.
   *
   * @param dto - Workflow definition version object to persist.
   *
   * @returns The newly created workflow.
   */
  @Post(':id/versions')
  async commit(
    @Param('id') id: string,
    @Body() dto: WorkflowNewVersionDto,
    @Req() req: Request,
  ): Promise<WorkflowVersion> {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to find Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }
    const userId = req.session?.passport?.user?.id;

    if (!userId) {
      throw new UnauthorizedException(
        'Only authenticated users can create workflows',
      );
    }

    if (dto.action === WorkflowVersionAction.restore) {
      if (!dto.parentVersion) {
        throw new UnauthorizedException('Parent version must be supplied ');
      }

      return await this.workflowVersionService.restoreVersion(
        id,
        dto.parentVersion,
        {
          updatedBy: userId,
          message: dto?.message ?? null,
        },
      );
    }

    return await this.workflowVersionService.commit({
      ...dto,
      workflow: id,
      parentVersion: workflow.currentVersion,
      createdBy: userId,
    });
  }

  /**
   * Retrieves versions for a workflow.
   *
   * @param id - The workflow ID.
   */
  @Get(':id/versions')
  async findMany(
    @Param('id') id: string,
    @Query(
      new TypeOrmSearchFilterPipe<WorkflowVersionOrmEntity>({
        allowedFields: ['message', 'action'],
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<WorkflowVersionOrmEntity> = {},
    @Query(PopulatePipe)
    populate: string[] = [],
  ) {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to find Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return this.canPopulate(populate)
      ? await this.workflowVersionService.findAndPopulate({
          ...(options ?? {}),
          where: {
            ...(options.where ?? {}),
            workflow: { id },
          },
        })
      : await this.workflowVersionService.find({
          ...(options ?? {}),
          where: {
            ...(options.where ?? {}),
            workflow: { id },
          },
        });
  }

  /**
   * Retrieves a specific workflow version.
   *
   * @param id - The workflow ID.
   * @param versionId - The version identifier.
   */
  @Get(':id/versions/:versionId')
  async findOne(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Query(PopulatePipe)
    populate: string[] = [],
  ) {
    const workflow = await this.workflowService.findOne(id);
    if (!workflow) {
      this.logger.warn(`Unable to find Workflow by id ${id}`);
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const version = this.canPopulate(populate)
      ? await this.workflowVersionService.findOneAndPopulate(versionId)
      : await this.workflowVersionService.findOne(versionId);

    if (!version) {
      throw new NotFoundException(
        `Workflow version with ID ${versionId} not found`,
      );
    }

    return version;
  }
}
