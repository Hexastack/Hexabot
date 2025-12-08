/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ActionSnapshot, BaseWorkflowContext } from '../context';
import type { StepInfo, WorkflowEventMap } from '../workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  ExecutionState,
  Suspension,
} from '../workflow-types';

export type StepExecutorEnv = {
  compiled: CompiledWorkflow;
  context: BaseWorkflowContext;
  runId?: string;
  buildInstanceStepInfo: (
    step: CompiledStep,
    iterationStack: number[],
  ) => StepInfo;
  markSnapshot: (
    step: StepInfo,
    status: ActionSnapshot['status'],
    reason?: string,
  ) => void;
  emit: <K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) => void;
  setCurrentStep: (step?: StepInfo) => void;
  captureTaskOutput: (
    task: CompiledTask,
    state: ExecutionState,
    result: unknown,
  ) => Promise<void>;
  executeFlow: (
    steps: CompiledStep[],
    state: ExecutionState,
    path: Array<number | string>,
    startIndex?: number,
  ) => Promise<Suspension | void>;
  executeStep: (
    step: CompiledStep,
    state: ExecutionState,
    path: Array<number | string>,
  ) => Promise<Suspension | void>;
};
