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

import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { Context } from '@/chat/types/context';

import { WorkflowRunFull } from './dto/workflow-run.dto';
import { Workflow } from './dto/workflow.dto';

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
      event: ConversationalEventWrapper<any, any>;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: ConversationalEventWrapper<any, any>;
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
