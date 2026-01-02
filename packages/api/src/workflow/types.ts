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

import { ChatContext } from '@/chat/types/chat-context';

import { WorkflowRunFull } from './dto/workflow-run.dto';
import { Workflow } from './dto/workflow.dto';
import { TriggerEventWrapper } from './lib/trigger-event-wrapper';

export enum WorkflowType {
  conversational = 'conversational',
  manual = 'manual',
  scheduled = 'scheduled',
}

export type WorkflowResult = WorkflowStartResult | WorkflowResumeResult;

export type RunWorkflowOptions =
  | {
      mode: 'start';
      workflow: Workflow;
      event: TriggerEventWrapper;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: TriggerEventWrapper;
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
  initiatorId?: string;
  workflowId?: string;
  chatContext?: ChatContext;
  runId?: string;
};
