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

import { MemoryDefinition } from './dto/memory-definition.dto';
import { WorkflowRunFull } from './dto/workflow-run.dto';
import { WorkflowFull } from './dto/workflow.dto';
import { TriggerEventWrapper } from './lib/trigger-event-wrapper';
import { SchemaInstance } from './utils/schema-instance';

export enum WorkflowType {
  conversational = 'conversational',
  manual = 'manual',
  scheduled = 'scheduled',
}

export enum WorkflowVersionAction {
  create = 'create',
  update = 'update',
  restore = 'restore',
  import = 'import',
}

export enum MemoryScope {
  global = 'global',
  workflow = 'workflow',
  run = 'run',
}

export type MemoryValue = Record<string, unknown>;

export type WorkflowResult = WorkflowStartResult | WorkflowResumeResult;

export type RunWorkflowOptions =
  | {
      mode: 'start';
      workflow: WorkflowFull;
      event: TriggerEventWrapper;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: TriggerEventWrapper;
    };

export type MarkRunningInput = {
  snapshot?: WorkflowSnapshot | null;
  lastResumeData?: unknown;
};

export type RunStrategy = {
  runner: WorkflowRunner;
  markRunningInput: MarkRunningInput;
  resumeData?: unknown;
  execute: () => Promise<WorkflowResult>;
};

export type WorkflowContextState = Record<string, unknown> & {
  initiatorId: string;
  workflowId: string;
  runId: string;
};

export type MemoryStoreData = Record<string, MemoryValue>;

export type MemoryStoreInstances = Record<string, SchemaInstance>;

export type MemoryStoreIdentifier = {
  ownerId: string;
  workflowId?: string | null;
  runId?: string | null;
};

export type MemoryStoreUpdater = (
  slug: string,
  value: MemoryValue,
) => Promise<MemoryValue>;

export type MemoryStoreBatchUpdater = (
  values: MemoryStoreData,
) => Promise<MemoryStoreData>;

export type MemoryStorePersistRecordFn = (params: {
  definition: MemoryDefinition;
  ownerId: string;
  workflowId?: string | null;
  runId?: string | null;
  value: MemoryValue;
}) => Promise<void>;

export enum DirectionType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}
