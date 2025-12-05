import type {
  ActionSnapshot,
  ActionStatus,
  BaseWorkflowContext,
  WorkflowRunStatus,
  WorkflowSnapshot,
} from './context';
import { RunnerRuntimeControl } from './runner-runtime-control';
import { executeConditional as runConditionalExecutor } from './step-executors/conditional-executor';
import { executeDoStep as runDoExecutor } from './step-executors/do-executor';
import { executeLoop as runLoopExecutor } from './step-executors/loop-executor';
import { executeParallel as runParallelExecutor } from './step-executors/parallel-executor';
import type { StepExecutorEnv } from './step-executors/types';
import {
  rebuildSuspension,
  type SuspensionRebuilderDeps,
} from './suspension-rebuilder';
import type { StepInfo, WorkflowEventMap } from './workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  EvaluationScope,
  ExecutionState,
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
  private status: WorkflowRunStatus = 'idle';
  // Snapshots of action execution keyed by step id for inspection/resume.
  private snapshots: Record<string, ActionSnapshot> = {};
  // Suspension state when execution is paused awaiting external input.
  private suspension?: Suspension;
  // Control surface exposed to actions to suspend/resume the workflow.
  private runtimeControl?: RunnerRuntimeControl;
  // Step currently being executed, used in event payloads and errors.
  private currentStep?: StepInfo;
  // Last payload provided to resume; exposed to actions via the context.
  private lastResumeData?: unknown;
  // Mutable execution state including input, memory, and outputs.
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
   * @param args Input payload, context, and optional memory to seed execution.
   * @returns Execution result including status and snapshot.
   */
  async start(args: RunnerStartArgs): Promise<StartResult> {
    this.status = 'running';
    this.snapshots = {};
    this.suspension = undefined;
    this.lastResumeData = undefined;
    this.currentStep = undefined;
    this.context = args.context;
    this.state = {
      input: this.compiled.inputParser.parse(args.inputData ?? {}),
      memory: args.memory ?? {},
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

    return this.runExecution(() =>
      this.executeFlow(this.compiled.flow, state, []),
    );
  }

  /**
   * Resume a previously suspended workflow using the supplied resume data.
   *
   * @param args Data provided to resume the suspended step.
   * @returns Execution result including status and snapshot.
   */
  async resume(args: RunnerResumeArgs): Promise<ResumeResult> {
    if (this.status !== 'suspended' || !this.suspension) {
      throw new Error('Cannot resume a workflow that is not suspended.');
    }

    if (!this.context || !this.state) {
      throw new Error('Workflow state is not initialized.');
    }

    this.status = 'running';
    this.lastResumeData = args.resumeData;

    const suspension = this.suspension;

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
        this.status = 'suspended';
        this.emit('hook:workflow:suspended', {
          runId: this.runId,
          step: suspension.step,
          reason: suspension.reason,
          data: suspension.data,
        });

        return {
          status: 'suspended',
          step: suspension.step,
          reason: suspension.reason,
          data: suspension.data,
          snapshot: this.getSnapshot(),
        };
      }

      const output = await this.evaluateWorkflowOutputs();
      this.status = 'finished';
      this.suspension = undefined;
      this.currentStep = undefined;
      this.emit('hook:workflow:finish', { runId: this.runId, output });
      if (!this.context) {
        throw new Error('Workflow context is not attached.');
      }
      this.context.attachWorkflowRuntime(undefined);

      return { status: 'finished', output, snapshot: this.getSnapshot() };
    } catch (error) {
      this.status = 'failed';
      this.currentStep = undefined;
      this.emit('hook:workflow:failure', { runId: this.runId, error });
      this.context?.attachWorkflowRuntime(undefined);

      return { status: 'failed', error, snapshot: this.getSnapshot() };
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
      suspension?: { stepId: string; reason?: string | null; data?: unknown };
      runId?: string;
      lastResumeData?: unknown;
    },
  ): Promise<WorkflowRunner> {
    const runner = new WorkflowRunner(compiled, {
      runId: options.runId,
    });

    runner.state = {
      input: options.state.input ?? {},
      memory: options.state.memory ?? {},
      output: options.state.output ?? {},
      iteration: options.state.iteration,
      accumulator: options.state.accumulator,
      iterationStack: [...(options.state.iterationStack ?? [])],
    };
    runner.context = options.context;
    runner.snapshots = options.snapshot.actions ?? {};
    runner.status = options.snapshot.status ?? 'idle';
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
        },
      );

      if (!suspension) {
        throw new Error(
          `Unable to rebuild suspension for step ${options.suspension.stepId}`,
        );
      }

      runner.suspension = suspension;
      runner.status = 'suspended';
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
      memory: this.state.memory,
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
    return { ...step.stepInfo, id: `${step.stepInfo.id}${suffix}` };
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
   * Construct the environment object passed to step executors.
   *
   * @returns A step executor environment bound to this runner.
   * @throws When the workflow context is missing.
   */
  private createExecutorEnv(): StepExecutorEnv {
    if (!this.context) {
      throw new Error('Workflow context is not attached.');
    }

    return {
      compiled: this.compiled,
      context: this.context,
      runId: this.runId,
      buildInstanceStepInfo: (step, iterationStack) =>
        this.buildInstanceStepInfo(step, iterationStack),
      markSnapshot: (step, status, reason) =>
        this.markSnapshot(step, status, reason),
      emit: (event, payload) => this.emit(event, payload),
      setCurrentStep: (step?: StepInfo) => {
        this.currentStep = step;
      },
      captureTaskOutput: (task, state, result) =>
        this.captureTaskOutput(task, state, result),
      executeFlow: (steps, state, path, startIndex) =>
        this.executeFlow(steps, state, path, startIndex),
      executeStep: (step, state, path) => this.executeStep(step, state, path),
    };
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
  ): Promise<Suspension | void> {
    // Walk the flow sequentially; if a step suspends, wrap its continuation so we resume at the same index.
    for (let index = startIndex; index < steps.length; index += 1) {
      const step = steps[index];
      const stepPath = [...path, index];
      const suspension = await this.executeStep(step, state, stepPath);

      if (suspension) {
        return {
          ...suspension,
          continue: async (resumeData: unknown) => {
            const next = await suspension.continue(resumeData);
            if (next) {
              return next;
            }
            return this.executeFlow(steps, state, path, index + 1);
          },
        };
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
  ): Promise<Suspension | void> {
    const env = this.createExecutorEnv();
    switch (step.kind) {
      case 'do':
        return runDoExecutor(env, step, state, path);
      case 'parallel':
        return runParallelExecutor(env, step, state, path);
      case 'conditional':
        return runConditionalExecutor(env, step, state, path);
      case 'loop':
        return runLoopExecutor(env, step, state, path);
    }
  }

  /**
   * Map task outputs onto workflow output state and evaluate expressions as define in the YAML definition.
   * @reviewed
   * @param task The task whose outputs are being captured.
   * @param state Current execution state to mutate.
   * @param result Raw result returned by the task action.
   */
  private async captureTaskOutput(
    task: CompiledTask,
    state: ExecutionState,
    result: unknown,
  ) {
    const env = this.createExecutorEnv();
    // Map task outputs through expressions; fall back to raw result when no mapping is provided.
    const scope: EvaluationScope = {
      input: state.input,
      context: env.context.state,
      memory: state.memory,
      output: state.output,
      iteration: state.iteration,
      accumulator: state.accumulator,
      result,
    };

    const mapped = await evaluateMapping(task.outputs, scope);
    state.output[task.name] = Object.keys(mapped).length > 0 ? mapped : result;
  }
}
