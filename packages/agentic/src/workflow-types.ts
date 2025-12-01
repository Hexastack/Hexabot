import type { Expression } from 'jsonata';
import type { ZodTypeAny } from 'zod';

import type { Action } from './action/action.types';
import type { Settings, TaskDefinition, WorkflowDefinition } from './dsl.types';
import type { WorkflowContext, WorkflowSnapshot } from './context';
import type { WorkflowEventEmitter, StepInfo } from './workflow-event-emitter';

/** Value representation used by the runtime after compilation. */
export type CompiledValue =
  | { kind: 'literal'; value: unknown }
  | { kind: 'expression'; source: string; expression: Expression };

/** Map of variable names to compiled values. */
export type CompiledMapping = Record<string, CompiledValue>;

/** Fully resolved task with parsed settings and compiled IO mappings. */
export type CompiledTask = {
  name: string;
  definition: TaskDefinition;
  actionName: string;
  action: Action<unknown, unknown, WorkflowContext, Settings>;
  inputs: CompiledMapping;
  outputs: CompiledMapping;
  settings: Settings;
};

/** Complete workflow ready for execution. */
export type CompiledWorkflow = {
  definition: WorkflowDefinition;
  tasks: Record<string, CompiledTask>;
  flow: CompiledStep[];
  outputMapping: CompiledMapping;
  inputParser: ZodTypeAny;
  defaultSettings?: Settings;
};

/** Any executable step inside the compiled flow. */
export type CompiledStep = DoStep | ParallelStep | ConditionalStep | LoopStep;

export type BaseStep = { id: string; stepInfo: StepInfo };

/** Single action execution. */
export type DoStep = BaseStep & {
  kind: 'do';
  taskName: string;
};

/** Runs nested steps with either wait-all or wait-any semantics. */
export type ParallelStep = BaseStep & {
  kind: 'parallel';
  description?: string;
  strategy: 'wait_all' | 'wait_any';
  steps: CompiledStep[];
};

/** Conditional branch tree describing when to run a step list. */
export type ConditionalBranch = {
  id: string;
  condition?: CompiledValue;
  steps: CompiledStep[];
};

/** Conditional step with multiple branches. */
export type ConditionalStep = BaseStep & {
  kind: 'conditional';
  description?: string;
  branches: ConditionalBranch[];
};

/** Loop over items with optional accumulator and break condition. */
export type LoopStep = BaseStep & {
  kind: 'loop';
  name?: string;
  description?: string;
  forEach: { item: string; in: CompiledValue };
  maxConcurrency?: number;
  until?: CompiledValue;
  accumulate?: { as: string; initial: unknown; merge: CompiledValue };
  steps: CompiledStep[];
};

/** Scope passed to value evaluators, reflecting the live runtime state. */
export type EvaluationScope = {
  input: Record<string, unknown>;
  context: WorkflowContext;
  memory: Record<string, unknown>;
  output: Record<string, unknown>;
  iteration?: { item: unknown; index: number };
  accumulator?: unknown;
  result?: unknown;
};

/** Minimal mutable state for the executor. */
export type ExecutionState = {
  input: Record<string, unknown>;
  memory: Record<string, unknown>;
  output: Record<string, unknown>;
  iteration?: { item: unknown; index: number };
  accumulator?: unknown;
  iterationStack: number[];
};

/** Encapsulates a suspended step and how to continue it. */
export type Suspension = {
  step: StepInfo;
  reason?: string;
  data?: unknown;
  continue: (resumeData: unknown) => Promise<Suspension | void>;
};

/** Result of starting a workflow run. */
export type StartResult =
  | { status: 'finished'; output: Record<string, unknown>; snapshot: WorkflowSnapshot }
  | { status: 'suspended'; step: StepInfo; reason?: string; data?: unknown; snapshot: WorkflowSnapshot }
  | { status: 'failed'; error: unknown; snapshot: WorkflowSnapshot };

/** Result of resuming a suspended workflow. */
export type ResumeResult =
  | { status: 'finished'; output: Record<string, unknown>; snapshot: WorkflowSnapshot }
  | { status: 'suspended'; step: StepInfo; reason?: string; data?: unknown; snapshot: WorkflowSnapshot }
  | { status: 'failed'; error: unknown; snapshot: WorkflowSnapshot };

/** Options that influence how the workflow runner behaves. */
export type WorkflowRunOptions = {
  memory?: Record<string, unknown>;
  eventEmitter?: WorkflowEventEmitter;
  runId?: string;
};

export type WorkflowStartResult = StartResult;
export type WorkflowResumeResult = ResumeResult;

/** Arguments required to start a run. */
export type RunnerStartArgs = {
  inputData: unknown;
  context: WorkflowContext;
  memory?: Record<string, unknown>;
};

/** Payload passed when resuming a suspended run. */
export type RunnerResumeArgs = {
  resumeData?: unknown;
};
