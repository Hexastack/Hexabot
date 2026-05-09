/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  ActionSnapshot,
  BaseWorkflowContext,
  StepExecutionRecord,
} from '../context';
import type {
  RuntimeResolvedSuspension,
  RuntimeStepReplaySeed,
  RuntimeSuspensionRequest,
} from '../runner-runtime-control';
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
  recordStepExecution: (
    step: StepInfo,
    update: Partial<StepExecutionRecord>,
  ) => StepExecutionRecord;
  emit: <K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) => void;
  setCurrentStep: (step?: StepInfo) => void;
  beginStepExecution?: (stepId: string) => string;
  waitForStepSuspension: (stepId: string) => Promise<RuntimeSuspensionRequest>;
  clearStepSuspensions: (stepId: string, error?: unknown) => void;
  primeStepResumeData: (stepId: string, resumeData: unknown) => void;
  prepareStepReplay?: (seed: RuntimeStepReplaySeed) => void;
  recordStepSuspendResult?: (params: RuntimeResolvedSuspension) => void;
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
