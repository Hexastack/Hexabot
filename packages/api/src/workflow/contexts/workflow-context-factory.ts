/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

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

  async create<E extends TriggerEventWrapper>(
    run: WorkflowRunFull,
    event: E,
  ): Promise<WorkflowRuntimeContext<E>> {
    const Ctx = this.map[event.triggerType];
    if (!Ctx) {
      throw new Error(`Unsupported triggerType: ${event.triggerType}`);
    }

    const ctx = await this.moduleRef.resolve<WorkflowRuntimeContext<E>>(Ctx);
    const memory = await this.memoryService.buildStore(
      {
        ownerId: run.triggeredBy.id,
        workflowId: run.workflow.id,
        runId: run.id,
      },
      ctx,
    );

    return await ctx.buildFromRun(run, event, memory);
  }
}
