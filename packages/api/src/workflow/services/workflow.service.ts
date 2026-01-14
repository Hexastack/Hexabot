/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { UserOrmEntity } from '@/user/entities/user.entity';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import defaultWorkflowDefinition, {
  defaultWorkflowDefinitionYaml,
} from '../defaults/default-workflow';
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
  WorkflowDtoConfig
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
  async pickWorkflow(): Promise<WorkflowDto | null> {
    const [latest] = await this.find({
      order: { createdAt: 'DESC' },
      take: 1,
    });
    const workflow = latest ?? (await this.ensureDefaultWorkflow());

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

      const creator = await this.getRepository()
        .getManager()
        .getRepository(UserOrmEntity)
        .findOne({ select: ['id'], order: { createdAt: 'ASC' }, where: {} });

      if (!creator?.id) {
        this.logger.warn(
          'Unable to ensure default workflow exists: missing creator',
        );

        return null;
      }

      return await this.create({
        name: defaultWorkflowDefinition.workflow.name,
        version: defaultWorkflowDefinition.workflow.version,
        description: defaultWorkflowDefinition.workflow.description,
        definitionYaml: defaultWorkflowDefinitionYaml,
        type: WorkflowType.conversational,
        schedule: null,
        createdBy: creator.id,
        memoryDefinitions: [],
      });
    } catch (err) {
      this.logger.error('Unable to ensure default workflow exists', err);

      return null;
    }
  }
}
