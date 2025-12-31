/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import defaultWorkflowDefinition from '../defaults/default-workflow';
import {
  Workflow as WorkflowDto,
  WorkflowDtoConfig,
  WorkflowTransformerDto,
} from '../dto/workflow.dto';
import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowType } from '../types';

@Injectable()
export class WorkflowService extends BaseOrmService<
  WorkflowOrmEntity,
  WorkflowTransformerDto,
  WorkflowDtoConfig,
  WorkflowRepository
> {
  /**
   * Creates the workflow service with the injected repository.
   *
   * @param repository - ORM repository used to manage workflow entities.
   */
  constructor(readonly repository: WorkflowRepository) {
    super(repository);
  }

  /**
   * Pick the most recently created workflow or fall back to the built-in default.
   */
  async pickWorkflow(
    type: WorkflowType = WorkflowType.conversational,
  ): Promise<WorkflowDto | null> {
    const [latest] = await this.find({
      where: { type },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const workflow =
      latest ??
      (type === WorkflowType.conversational
        ? await this.ensureDefaultWorkflow()
        : null);

    return workflow;
  }

  /**
   * Ensure a default workflow exists and return it when none are stored.
   *
   * @returns The existing or newly created default workflow, or `null` when creation fails.
   */
  private async ensureDefaultWorkflow(): Promise<WorkflowDto | null> {
    try {
      const existing = await this.findOne({
        where: {
          name: defaultWorkflowDefinition.workflow.name,
          version: defaultWorkflowDefinition.workflow.version,
        },
      });

      if (existing) {
        return existing;
      }

      return await this.create({
        name: defaultWorkflowDefinition.workflow.name,
        version: defaultWorkflowDefinition.workflow.version,
        description: defaultWorkflowDefinition.workflow.description,
        type: WorkflowType.conversational,
        schedule: null,
        definition: defaultWorkflowDefinition,
      });
    } catch (err) {
      this.logger.error('Unable to ensure default workflow exists', err);

      return null;
    }
  }
}
