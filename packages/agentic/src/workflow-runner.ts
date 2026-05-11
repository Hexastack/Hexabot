/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  EWorkflowRunStatus,
  type ActionSnapshot,
  type ActionStatus,
  type BaseWorkflowContext,
  type StepExecutionRecord,
  type WorkflowRunStatus,
  type WorkflowSnapshot,
} from './context';
import { throwIfAborted } from './errors';
import { RunnerRuntimeControl } from './runner-runtime-control';
import { executeConditional as runConditionalExecutor } from './step-executors/conditional-executor';
import { executeLoop as runLoopExecutor } from './step-executors/loop-executor';
import { executeParallel as runParallelExecutor } from './step-executors/parallel-executor';
import { wrapSuspensionContinuation } from './step-executors/suspension-continuation';
import { executeTaskStep as runTaskExecutor } from './step-executors/task-executor';
import type {
  StepExecutorEnv,
  StepExecutorEnvForkOverrides,
} from './step-executors/types';
import {
  rebuildSuspension,
  type SuspensionRebuilderDeps,
} from './suspension-rebuilder';
import {
  StepType,
  type StepInfo,
  type WorkflowEventMap,
} from './workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  ExecutionState,
  PersistedSuspension,
  ResumeResult,
  RunnerResumeArgs,
  RunnerStartArgs,
  StartResult,
  Suspension,
  WorkflowRunOptions,
} from './workflow-types';
import { evaluateMapping } from './workflow-values';

/**
 * Executes a compiled workflow definition, tracking state, suspensions, and event hooks.
 * Create a new instance per execution to avoid leaking state between runs.
 */
export class WorkflowRunner {
  // Compiled workflow definition driving this runner.
  private readonly compiled: CompiledWorkflow;

  // External run identifier propagated through events for correlation.
  private readonly runId?: string;

  // Current lifecycle status of the workflow execution.
  private status: WorkflowRunStatus = EWorkflowRunStatus.IDLE;

  // Snapshots of action execution keyed by step id for inspection/resume.
  private snapshots: Record<string, ActionSnapshot> = {};

  // Detailed execution records for each task step, used by UI/telemetry.
  private stepLog: Record<string, StepExecutionRecord> = {};

  // Suspension state when execution is paused awaiting external input.
  private suspension?: Suspension;

  // Control surface exposed to actions to suspend/resume the workflow.
  private runtimeControl?: RunnerRuntimeControl;

  // Step currently being executed, used in event payloads and errors.
  private currentStep?: StepInfo;

  // Last payload provided to resume; exposed to actions via the context.
  private lastResumeData?: unknown;

  // Mutable execution state including input and outputs.
  private state?: ExecutionState;

  // Workflow context shared with actions for IO and side-effects.
  private context?: BaseWorkflowContext;

  /**
   * Create a new runner for a compiled workflow definition.
   *
   * @param compiled The compiled workflow to execute.
   * @param options Optional runner configuration such as run id.
   */
  constructor(compiled: CompiledWorkflow, options?: WorkflowRunOptions) {
    this.compiled = compiled;
    this.runId = options?.runId;
  }

  /**
   * Get the current state of the workflow run.
   *
   * @returns The state of the workflow execution.
   */
  getState(): ExecutionState | undefined {
    return this.state;
  }

  /**
   * Get the current lifecycle status of the workflow run.
   *
   * @returns The status of the workflow execution.
   */
  getStatus(): WorkflowRunStatus {
    return this.status;
  }

  /**
   * Snapshot the current workflow status and action states.
   *
   * @returns A snapshot representing the workflow and each action's status.
   */
  getSnapshot(): WorkflowSnapshot {
    return {
      status: this.status,
      actions: { ...this.snapshots },
    };
  }

  /**
   * Read the per-step execution records captured for UI/telemetry.
   *
   * @returns A shallow copy of the step execution log.
   */
  getStepLog(): Record<string, StepExecutionRecord> {
    return Object.fromEntries(
      Object.entries(this.stepLog).map(([id, record]) => [
        id,
        {
          ...record,
          context: record.context ? { ...record.context } : undefined,
          error: record.error ? { ...record.error } : undefined,
        },
      ]),
    );
  }

  /**
   * Read the step currently being executed.
   *
   * @returns Metadata for the in-flight step, if any.
   */
  getCurrentStep(): StepInfo | undefined {
    return this.currentStep;
  }

  /**
   * Access the last payload supplied to a resume call.
   *
   * @returns The most recent resume data, or undefined if none.
   */
  getLastResumeData(): unknown {
    return this.lastResumeData;
  }

  /**
   * Begin executing the workflow from the first step.
   * Returns a status object describing whether execution finished, suspended, or failed.
   *
   * @param args Input payload and context to seed execution.
   * @returns Execution result including status and snapshot.
   */
  async start(args: RunnerStartArgs): Promise<StartResult> {
    this.status = EWorkflowRunStatus.RUNNING;
    this.snapshots = {};
    this.stepLog = {};
    this.suspension = undefined;
    this.lastResumeData = undefined;
    this.currentStep = undefined;
    this.context = args.context;
    this.state = {
      input: this.compiled.inputParser.parse(args.inputData ?? {}),
      output: {},
      iterationStack: [],
    };

    this.runtimeControl = new RunnerRuntimeControl(this);
    this.context.attachWorkflowRuntime(this.runtimeControl);

    this.emit('hook:workflow:start', { runId: this.runId });

    const state = this.state;
    if (!state) {
      throw new Error('Workflow state not initialized.');
    }

    const env = this.createExecutorEnv();

    return this.runExecution(() =>
      this.executeFlow(this.compiled.flow, state, [], 0, env),
    );
  }

  /**
   * Resume a previously suspended workflow using the supplied resume data.
   *
   * @param args Data provided to resume the suspended step.
   * @returns Execution result including status and snapshot.
   */
  async resume(args: RunnerResumeArgs): Promise<ResumeResult> {
    if (this.status !== EWorkflowRunStatus.SUSPENDED || !this.suspension) {
      throw new Error('Cannot resume a workflow that is not suspended.');
    }

    if (!this.context || !this.state) {
      throw new Error('Workflow state is not initialized.');
    }

    this.status = EWorkflowRunStatus.RUNNING;
    this.lastResumeData = args.resumeData;

    const suspension: Suspension = this.suspension;

    return this.runExecution(() => suspension.continue(args.resumeData));
  }

  /**
   * Execute the provided workflow operation and normalize suspension, finish, and failure handling.
   *
   * @param execute Function that advances workflow execution and may return a suspension.
   * @returns Result of the execution attempt.
   */
  private async runExecution(
    execute: () => Promise<Suspension | void>,
  ): Promise<StartResult> {
    try {
      const suspension = await execute();

      if (suspension) {
        this.suspension = suspension;
        this.status = EWorkflowRunStatus.SUSPENDED;
        this.emit('hook:workflow:suspended', {
          runId: this.runId,
          step: suspension.step,
          reason: suspension.reason,
          data: suspension.data,
        });

        return {
          status: EWorkflowRunStatus.SUSPENDED,
          step: suspension.step,
          reason: suspension.reason,
          data: suspension.data,
          stepExecId: suspension.stepExecId,
          suspendIndex: suspension.suspendIndex,
          suspendKey: suspension.suspendKey,
          awaitResults: suspension.awaitResults,
          snapshot: this.getSnapshot(),
        };
      }

      const output = await this.evaluateWorkflowOutputs();
      this.status = EWorkflowRunStatus.FINISHED;
      this.suspension = undefined;
      this.currentStep = undefined;
      this.emit('hook:workflow:finish', { runId: this.runId, output });
      if (!this.context) {
        throw new Error('Workflow context is not attached.');
      }
      this.context.attachWorkflowRuntime(undefined);

      return {
        status: EWorkflowRunStatus.FINISHED,
        output,
        snapshot: this.getSnapshot(),
      };
    } catch (error) {
      this.status = EWorkflowRunStatus.FAILED;
      this.currentStep = undefined;
      this.emit('hook:workflow:failure', { runId: this.runId, error });
      this.context?.attachWorkflowRuntime(undefined);

      return {
        status: EWorkflowRunStatus.FAILED,
        error,
        snapshot: this.getSnapshot(),
      };
    }
  }

  /**
   * Rebuild a runner from persisted state, allowing hosts to resume after restarts.
   *
   * @param compiled The compiled workflow definition.
   * @param options Persisted state and metadata needed to rebuild the runner.
   * @returns A runner positioned to continue from the prior suspension or status.
   */
  static async fromPersistedState(
    compiled: CompiledWorkflow,
    options: {
      state: ExecutionState;
      context: BaseWorkflowContext;
      snapshot: WorkflowSnapshot;
      suspension?: PersistedSuspension;
      runId?: string;
      lastResumeData?: unknown;
    },
  ): Promise<WorkflowRunner> {
    const runner = new WorkflowRunner(compiled, {
      runId: options.runId,
    });

    runner.state = {
      input: options.state.input ?? {},
      output: options.state.output ?? {},
      iteration: options.state.iteration,
      accumulator: options.state.accumulator,
      iterationStack: [...(options.state.iterationStack ?? [])],
    };
    runner.context = options.context;
    runner.snapshots = options.snapshot.actions ?? {};
    runner.stepLog = {};
    runner.status = options.snapshot.status ?? EWorkflowRunStatus.IDLE;
    runner.lastResumeData = options.lastResumeData;
    runner.runtimeControl = new RunnerRuntimeControl(runner);
    options.context.attachWorkflowRuntime(runner.runtimeControl);

    if (options.suspension) {
      const suspension = rebuildSuspension(
        runner.createSuspensionRebuilderDeps(),
        {
          state: runner.state,
          stepId: options.suspension.stepId,
          reason: options.suspension.reason ?? undefined,
          data: options.suspension.data,
          stepExecId: options.suspension.stepExecId,
          suspendIndex: options.suspension.suspendIndex,
          suspendKey: options.suspension.suspendKey,
          awaitResults: options.suspension.awaitResults,
        },
      );

      if (!suspension) {
        throw new Error(
          `Unable to rebuild suspension for step ${options.suspension.stepId}`,
        );
      }

      runner.suspension = suspension;
      runner.status = EWorkflowRunStatus.SUSPENDED;
    }

    return runner;
  }

  /**
   * Emit an event if an emitter is provided.
   *
   * @param event The event name to emit.
   * @param payload The event payload.
   */
  private emit<K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) {
    this.context?.eventEmitter?.emit(event, payload);
  }

  /**
   * Evaluate and map the workflow outputs after all steps have completed.
   * Throws if the internal state or context were not initialized.
   *
   * @returns The evaluated workflow outputs.
   * @throws When state or context are missing.
   */
  private async evaluateWorkflowOutputs(): Promise<Record<string, unknown>> {
    if (!this.state || !this.context) {
      throw new Error('Workflow state not initialized.');
    }

    return evaluateMapping(this.compiled.outputMapping, {
      input: this.state.input,
      context: this.context.state,
      output: this.state.output,
    });
  }

  /**
   * Build a stable step id that reflects the current loop iteration stack.
   *
   * @param step The compiled step to annotate.
   * @param iterationStack The loop stack representing nested iterations.
   * @returns A step info object with an iteration-aware id.
   */
  private buildInstanceStepInfo(
    step: CompiledStep,
    iterationStack: number[],
  ): StepInfo {
    const suffix =
      iterationStack.length > 0 ? `[${iterationStack.join('.')}]` : '';

    return {
      id: `${step.id}${suffix}`,
      name: step.label,
      type: step.type,
    };
  }

  /**
   * Record an action snapshot for the given step id.
   *
   * @param step The step being updated.
   * @param status The new snapshot status.
   * @param reason Optional reason to include when marking failure/suspension.
   */
  private markSnapshot(step: StepInfo, status: ActionStatus, reason?: string) {
    this.snapshots[step.id] = {
      id: step.id,
      name: step.name,
      status,
      reason,
    };
  }

  /**
   * Record a detailed execution entry for the given step.
   *
   * @param step The step being updated.
   * @param update Partial record fields to merge into the log.
   */
  private recordStepExecution(
    step: StepInfo,
    update: Partial<StepExecutionRecord>,
  ): StepExecutionRecord {
    const existing = this.stepLog[step.id];
    const base: StepExecutionRecord =
      existing ??
      ({
        id: step.id,
        name: step.name,
        status: 'pending',
      } satisfies StepExecutionRecord);
    const mergedContext =
      existing?.context || update.context
        ? { ...existing?.context, ...update.context }
        : undefined;
    const nextRecord: StepExecutionRecord = {
      ...base,
      ...update,
      id: step.id,
      name: step.name,
      status: update.status ?? base.status,
      context: mergedContext,
    };

    this.stepLog[step.id] = nextRecord;

    return {
      ...nextRecord,
      context: nextRecord.context ? { ...nextRecord.context } : undefined,
      error: nextRecord.error ? { ...nextRecord.error } : undefined,
    };
  }

  /**
   * Construct the environment object passed to step executors.
   *
   * @returns A step executor environment bound to this runner.
   * @throws When the workflow context is missing.
   */
  private createExecutorEnv(
    overrides: StepExecutorEnvForkOverrides = {},
  ): StepExecutorEnv {
    const context = overrides.context ?? this.context;
    if (!context) {
      throw new Error('Workflow context is not attached.');
    }

    const signal = overrides.signal ?? new AbortController().signal;
    const setCurrentStep =
      overrides.setCurrentStep ??
      ((step?: StepInfo) => {
        this.currentStep = step;
      });
    const captureTaskOutput =
      overrides.captureTaskOutput ??
      ((task: CompiledTask, state: ExecutionState, result: unknown) =>
        this.captureTaskOutput(task, state, result));
    const executorEnv: StepExecutorEnv = {
      compiled: this.compiled,
      context,
      signal,
      runId: this.runId,
      buildInstanceStepInfo: (step, iterationStack) =>
        this.buildInstanceStepInfo(step, iterationStack),
      markSnapshot: (step, status, reason) =>
        this.markSnapshot(step, status, reason),
      recordStepExecution: (step, update) =>
        this.recordStepExecution(step, update),
      emit: (event, payload) => this.emit(event, payload),
      setCurrentStep,
      beginStepExecution: (stepId) => {
        if (!this.runtimeControl) {
          return `${stepId}#1`;
        }

        return this.runtimeControl.beginStepExecution(stepId);
      },
      waitForStepSuspension: (stepId) => {
        if (!this.runtimeControl) {
          throw new Error('Workflow runtime control is not initialized.');
        }

        return this.runtimeControl.waitForStepSuspension(stepId);
      },
      clearStepSuspensions: (stepId, error) => {
        this.runtimeControl?.clearStepSuspensions(stepId, error);
      },
      primeStepResumeData: (stepId, resumeData) => {
        this.runtimeControl?.primeStepResumeData(stepId, resumeData);
      },
      prepareStepReplay: (seed) => {
        this.runtimeControl?.prepareStepReplay(seed);
      },
      recordStepSuspendResult: (params) => {
        this.runtimeControl?.recordStepSuspendResult(params);
      },
      captureTaskOutput,
      executeFlow: (steps, state, path, startIndex) =>
        this.executeFlow(steps, state, path, startIndex, executorEnv),
      executeStep: (step, state, path) =>
        this.executeStep(step, state, path, executorEnv),
      fork: (forkOverrides) =>
        this.createExecutorEnv({
          context: forkOverrides.context ?? context,
          signal: forkOverrides.signal ?? signal,
          setCurrentStep: forkOverrides.setCurrentStep ?? setCurrentStep,
          captureTaskOutput:
            forkOverrides.captureTaskOutput ?? captureTaskOutput,
        }),
    };

    return executorEnv;
  }

  /**
   * Build dependencies used to reconstruct a suspension from persisted state.
   *
   * @returns Dependency bag for suspension rebuilders.
   */
  private createSuspensionRebuilderDeps(): SuspensionRebuilderDeps {
    return {
      compiled: this.compiled,
      context: this.context,
      runId: this.runId,
      createExecutorEnv: () => this.createExecutorEnv(),
      buildInstanceStepInfo: (step, iterationStack) =>
        this.buildInstanceStepInfo(step, iterationStack),
      captureTaskOutput: (task, state, result) =>
        this.captureTaskOutput(task, state, result),
      markSnapshot: (step, status, reason) =>
        this.markSnapshot(step, status, reason),
      emit: (event, payload) => this.emit(event, payload),
      executeFlow: (steps, state, path, startIndex) =>
        this.executeFlow(steps, state, path, startIndex),
    };
  }

  /**
   * Walk a list of compiled steps, threading state and returning a suspension when encountered.
   *
   * @param steps The steps to execute sequentially.
   * @param state Mutable execution state shared across steps.
   * @param path Path tokens leading to the current step for tracing.
   * @param startIndex Index to resume from within the flow.
   * @returns A suspension if execution pauses, otherwise void.
   */
  private async executeFlow(
    steps: CompiledStep[],
    state: ExecutionState,
    path: Array<number | string>,
    startIndex = 0,
    env = this.createExecutorEnv(),
  ): Promise<Suspension | void> {
    // Walk the flow sequentially; if a step suspends, wrap its continuation so we resume at the same index.
    for (let index = startIndex; index < steps.length; index += 1) {
      throwIfAborted(env.signal);

      const step = steps[index];
      const stepPath = [...path, index];
      const suspension = await this.executeStep(step, state, stepPath, env);

      if (suspension) {
        return wrapSuspensionContinuation(suspension, () =>
          this.executeFlow(steps, state, path, index + 1, env),
        );
      }
    }

    return undefined;
  }

  /**
   * Execute a single compiled step by delegating to its executor.
   *
   * @param step The step to run.
   * @param state The shared execution state.
   * @param path Tokens describing the location of the step in the workflow.
   * @returns A suspension if the step pauses execution, otherwise void.
   */
  private async executeStep(
    step: CompiledStep,
    state: ExecutionState,
    path: Array<number | string>,
    env = this.createExecutorEnv(),
  ): Promise<Suspension | void> {
    throwIfAborted(env.signal);

    switch (step.type) {
      case StepType.Task:
        return runTaskExecutor(env, step, state, path);
      case StepType.Parallel:
        return runParallelExecutor(env, step, state, path);
      case StepType.Conditional:
        return runConditionalExecutor(env, step, state, path);
      case StepType.Loop:
        return runLoopExecutor(env, step, state, path);
    }
  }

  /**
   * Store the raw task result under the task name in the workflow output state.
   *
   * @param task The task whose output is being captured.
   * @param state Current execution state to mutate.
   * @param result Raw result returned by the task action.
   */
  private async captureTaskOutput(
    task: CompiledTask,
    state: ExecutionState,
    result: unknown,
  ) {
    state.output[task.name] = result;
  }
}
