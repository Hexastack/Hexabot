/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export { AbstractAction } from './action/abstract-action';

export { defineAction } from './action/action';

export type { DefineActionParams } from './action/action';

export type {
  Action,
  ActionExecutionArgs,
  ActionExecutionOutcome,
  ActionMetadata,
  InferActionArgs,
  InferActionContext,
  InferActionInput,
  InferActionOutput,
  InferActionSettings,
  SuspensionNotice,
} from './action/action.types';

export {
  BaseWorkflowContext,
  type ActionSnapshot,
  type ActionStatus,
  type SuspensionOptions,
  type WorkflowRunStatus,
  type WorkflowRuntimeControl,
  type WorkflowSnapshot,
} from './context';

export * from './dsl.types';

export { WorkflowSuspendedError } from './runtime-error';

export {
  compileWorkflow,
  Workflow,
  WorkflowEventEmitter,
  WorkflowRunner,
  type WorkflowResumeResult,
  type WorkflowRunOptions,
  type WorkflowStartResult,
} from './workflow';

export type {
  StepInfo,
  StepType,
  WorkflowEventEmitterLike,
  WorkflowEventMap,
} from './workflow-event-emitter';

export type {
  BaseStep as CompiledBaseStep,
  ConditionalBranch as CompiledConditionalBranch,
  ConditionalStep as CompiledConditionalStep,
  DoStep as CompiledDoStep,
  LoopStep as CompiledLoopStep,
  CompiledMapping,
  ParallelStep as CompiledParallelStep,
  CompiledStep,
  CompiledTask,
  CompiledValue,
  CompiledWorkflow,
  EvaluationScope,
  ExecutionState,
  RunnerResumeArgs,
  RunnerStartArgs,
  Suspension,
  ResumeResult as WorkflowResumeOutcome,
  StartResult as WorkflowStartOutcome,
} from './workflow-types';

export {
  compileValue,
  evaluateMapping,
  evaluateValue,
  mergeSettings,
} from './workflow-values';

export { createDeferred } from './utils/deferred';

export type { Deferred } from './utils/deferred';

export {
  assertSnakeCaseName,
  isSnakeCaseName,
  toSnakeCase,
} from './utils/naming';

export { sleep, withTimeout } from './utils/timeout';
