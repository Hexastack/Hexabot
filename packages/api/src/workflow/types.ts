/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WorkflowResumeResult,
  WorkflowRunner,
  WorkflowSnapshot,
  WorkflowStartResult,
} from '@hexabot-ai/agentic';

import { Subscriber } from '@/chat/dto/subscriber.dto';
import { Context } from '@/chat/types/context';

import { WorkflowRunFull } from './dto/workflow-run.dto';
import { Workflow } from './dto/workflow.dto';
import { TriggerEventWrapper } from './lib/trigger-event-wrapper';

export enum WorkflowType {
  conversational = 'conversational',
  manual = 'manual',
  scheduled = 'scheduled',
}

export type WorkflowResult = WorkflowStartResult | WorkflowResumeResult;

export type StartWorkflowOptions = {
  trigger: WorkflowType;
  input?: Record<string, unknown>;
  subscriber?: Subscriber | null;
  triggeredAt?: Date | string;
};

export type RunWorkflowOptions<E extends TriggerEventWrapper> =
  | {
      mode: 'start';
      workflow: Workflow;
      event: E;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: E;
    };

export type MarkRunningInput = {
  snapshot?: WorkflowSnapshot | null;
  memory?: Record<string, unknown> | null;
  lastResumeData?: unknown;
};

export type RunStrategy = {
  runner: WorkflowRunner;
  markRunningInput: MarkRunningInput;
  resumeData?: unknown;
  execute: () => Promise<WorkflowResult>;
};

export type WorkflowContextState = Record<string, unknown> & {
  subscriberId?: string;
  workflowId?: string;
  chatContext?: Context;
  runId?: string;
};
