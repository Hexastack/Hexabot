/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from '@hexabot-ai/agentic';
import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { WorkflowRunFull } from '../dto/workflow-run.dto';
import { TriggerEventWrapper } from '../lib/trigger-event-wrapper';
import { MemoryService } from '../services/memory.service';
import { WorkflowType } from '../types';

import { ConversationalWorkflowContext } from './conversational-workflow.context';
import { ManualWorkflowContext } from './manual-workflow.context';
import { ScheduledWorkflowContext } from './scheduled-workflow.context';
import { WorkflowRuntimeContext } from './workflow-runtime.context';

@Injectable()
export class WorkflowContextFactory {
  private readonly map: Record<WorkflowType, Type<WorkflowRuntimeContext>> = {
    [WorkflowType.conversational]: ConversationalWorkflowContext,
    [WorkflowType.manual]: ManualWorkflowContext,
    [WorkflowType.scheduled]: ScheduledWorkflowContext,
  };

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly memoryService: MemoryService,
  ) {}

  private extractMemoryDefinitionIds(
    definition?: WorkflowDefinition,
  ): string[] {
    if (!definition?.defs) {
      return [];
    }

    const ids = Object.values(definition.defs)
      .filter((def) => def?.kind === 'memory')
      .map(
        (def) =>
          (def as { settings?: { definition_id?: unknown } }).settings
            ?.definition_id,
      )
      .filter((value): value is string => typeof value === 'string' && !!value);

    return Array.from(new Set(ids));
  }

  async create<E extends TriggerEventWrapper>(
    run: WorkflowRunFull,
    event: E,
    definition?: WorkflowDefinition,
  ): Promise<WorkflowRuntimeContext<E>> {
    const Ctx = this.map[event.triggerType];
    if (!Ctx) {
      throw new Error(`Unsupported triggerType: ${event.triggerType}`);
    }

    const ctx = await this.moduleRef.resolve<WorkflowRuntimeContext<E>>(Ctx);
    const memoryDefinitionIds = this.extractMemoryDefinitionIds(definition);
    const triggeredById = run.triggeredBy?.id;
    if (!triggeredById) {
      throw new Error(`Workflow run ${run.id} is missing triggeredBy`);
    }
    const memory = await this.memoryService.buildStore(
      {
        ownerId: triggeredById,
        workflowId: run.workflow.id,
        threadId: run.thread?.id ?? null,
        runId: run.id,
        memoryDefinitionIds,
      },
      ctx,
    );

    return await ctx.buildFromRun(run, event, memory);
  }
}
