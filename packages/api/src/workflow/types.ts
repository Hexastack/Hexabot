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

import EventWrapper from '@/channel/lib/EventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { Context } from '@/chat/types/context';

import { WorkflowRunFull } from './dto/workflow-run.dto';
import { Workflow } from './dto/workflow.dto';

export type WorkflowResult = WorkflowStartResult | WorkflowResumeResult;

export type RunWorkflowOptions =
  | {
      mode: 'start';
      workflow: Workflow;
      subscriber: Subscriber;
      event: EventWrapper<any, any>;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: EventWrapper<any, any>;
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
