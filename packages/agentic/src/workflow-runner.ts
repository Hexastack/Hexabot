import type {
  ActionSnapshot,
  BaseWorkflowContext,
  SuspensionOptions,
  WorkflowRunStatus,
  WorkflowRuntimeControl,
  WorkflowSnapshot,
} from './context';
import { WorkflowSuspendedError } from './runtime-error';
import type {
  StepInfo,
  WorkflowEventEmitter,
  WorkflowEventMap,
} from './workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  ConditionalStep,
  DoStep,
  EvaluationScope,
  ExecutionState,
  LoopStep,
  ParallelStep,
  ResumeResult,
  RunnerResumeArgs,
  RunnerStartArgs,
  StartResult,
  Suspension,
  WorkflowRunOptions,
} from './workflow-types';
import { evaluateMapping, evaluateValue } from './workflow-values';

/** Minimal wrapper that exposes runner controls to actions via the context. */
class RunnerRuntimeControl implements WorkflowRuntimeControl {
  private readonly runner: WorkflowRunner;

  constructor(runner: WorkflowRunner) {
    this.runner = runner;
  }

  get status(): WorkflowRunStatus {
    return this.runner.getStatus();
  }

  get resumeData(): unknown {
    return this.runner.getLastResumeData();
  }

  suspend<T = unknown>(options?: SuspensionOptions): Promise<T> {
    const currentStep = this.runner.getCurrentStep();
    throw new WorkflowSuspendedError(currentStep?.id ?? 'unknown', options);
  }

  resume(data?: unknown): void {
    void this.runner.resume({ resumeData: data });
  }

  getSnapshot() {
    return this.runner.getSnapshot();
  }
}

/**
 * Executes a compiled workflow definition, tracking state, suspensions, and event hooks.
 * Create a new instance per execution to avoid leaking state between runs.
 */
export class WorkflowRunner {
  // Compiled workflow definition driving this runner.
  private readonly compiled: CompiledWorkflow;
  // Optional event emitter used to surface lifecycle notifications.
  private readonly eventEmitter?: WorkflowEventEmitter;
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

  constructor(compiled: CompiledWorkflow, options?: WorkflowRunOptions) {
    this.compiled = compiled;
    this.eventEmitter = options?.eventEmitter;
    this.runId = options?.runId;
  }

  getStatus(): WorkflowRunStatus {
    return this.status;
  }

  getSnapshot(): WorkflowSnapshot {
    return {
      status: this.status,
      actions: { ...this.snapshots },
    };
  }

  getCurrentStep(): StepInfo | undefined {
    return this.currentStep;
  }

  getLastResumeData(): unknown {
    return this.lastResumeData;
  }

  /**
   * Begin executing the workflow from the first step.
   * Returns a status object describing whether execution finished, suspended, or failed.
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

    this.emit('workflow:start', { runId: this.runId });

    try {
      const suspension = await this.executeFlow(
        this.compiled.flow,
        this.state,
        [],
      );

      if (suspension) {
        this.suspension = suspension;
        this.status = 'suspended';
        this.emit('workflow:suspended', {
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
      this.emit('workflow:finish', { runId: this.runId, output });
      this.context.attachWorkflowRuntime(undefined);

      return { status: 'finished', output, snapshot: this.getSnapshot() };
    } catch (error) {
      this.status = 'failed';
      this.currentStep = undefined;
      this.emit('workflow:failure', { runId: this.runId, error });
      this.context?.attachWorkflowRuntime(undefined);
      return { status: 'failed', error, snapshot: this.getSnapshot() };
    }
  }

  /**
   * Resume a previously suspended workflow using the supplied resume data.
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

    try {
      const nextSuspension = await this.suspension.continue(args.resumeData);

      if (nextSuspension) {
        this.suspension = nextSuspension;
        this.status = 'suspended';
        this.emit('workflow:suspended', {
          runId: this.runId,
          step: nextSuspension.step,
          reason: nextSuspension.reason,
          data: nextSuspension.data,
        });

        return {
          status: 'suspended',
          step: nextSuspension.step,
          reason: nextSuspension.reason,
          data: nextSuspension.data,
          snapshot: this.getSnapshot(),
        };
      }

      const output = await this.evaluateWorkflowOutputs();
      this.status = 'finished';
      this.suspension = undefined;
      this.currentStep = undefined;
      this.emit('workflow:finish', { runId: this.runId, output });
      this.context.attachWorkflowRuntime(undefined);

      return { status: 'finished', output, snapshot: this.getSnapshot() };
    } catch (error) {
      this.status = 'failed';
      this.currentStep = undefined;
      this.emit('workflow:failure', { runId: this.runId, error });
      this.context.attachWorkflowRuntime(undefined);

      return { status: 'failed', error, snapshot: this.getSnapshot() };
    }
  }

  /** Emit an event if an emitter is provided. */
  private emit<K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) {
    this.eventEmitter?.emitEvent(event, payload);
  }

  /**
   * Evaluate and map the workflow outputs after all steps have completed.
   * Throws if the internal state or context were not initialized.
   */
  private async evaluateWorkflowOutputs(): Promise<Record<string, unknown>> {
    if (!this.state || !this.context) {
      throw new Error('Workflow state not initialized.');
    }

    return evaluateMapping(this.compiled.outputMapping, {
      input: this.state.input,
      context: this.context,
      memory: this.state.memory,
      output: this.state.output,
    });
  }

  /** Build a stable step id that reflects the current loop iteration stack. */
  private buildInstanceStepInfo(
    step: CompiledStep,
    iterationStack: number[],
  ): StepInfo {
    const suffix =
      iterationStack.length > 0 ? `[${iterationStack.join('.')}]` : '';
    return { ...step.stepInfo, id: `${step.stepInfo.id}${suffix}` };
  }

  private markSnapshot(
    step: StepInfo,
    status: ActionSnapshot['status'],
    reason?: string,
  ) {
    this.snapshots[step.id] = {
      id: step.id,
      name: step.name,
      status,
      reason,
    };
  }

  /**
   * Walk a list of compiled steps, threading state and returning a suspension when encountered.
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

  private async executeStep(
    step: CompiledStep,
    state: ExecutionState,
    path: Array<number | string>,
  ): Promise<Suspension | void> {
    // Dispatch execution based on step kind; undefined means the branch finished.
    switch (step.kind) {
      case 'do':
        return this.executeDoStep(step, state, path);
      case 'parallel':
        return this.executeParallel(step, state, path);
      case 'conditional':
        return this.executeConditional(step, state, path);
      case 'loop':
        return this.executeLoop(step, state, path);
      default:
        return undefined;
    }
  }

  /** Execute a single task step, capturing outputs and handling suspension/errors. */
  private async executeDoStep(
    step: DoStep,
    state: ExecutionState,
    path: Array<number | string>,
  ): Promise<Suspension | void> {
    // Execute a single task and capture its output; suspension bubbles up when requested by the action.
    if (!this.context) {
      throw new Error('Workflow context is not attached.');
    }

    const task = this.compiled.tasks[step.taskName];
    if (!task) {
      throw new Error(`Task "${step.taskName}" is not defined.`);
    }

    const stepInfo = this.buildInstanceStepInfo(step, state.iterationStack);
    const scope: EvaluationScope = {
      input: state.input,
      context: this.context,
      memory: state.memory,
      output: state.output,
      iteration: state.iteration,
      accumulator: state.accumulator,
    };

    // Inputs are evaluated prior to marking the step as running to catch expression errors early.
    const inputs = await evaluateMapping(task.inputs, scope);
    this.currentStep = stepInfo;
    this.markSnapshot(stepInfo, 'running');
    this.emit('step:start', { runId: this.runId, step: stepInfo });

    try {
      const result = await task.action.run(inputs, this.context, task.settings);
      await this.captureTaskOutput(task, stepInfo, state, result);
      this.markSnapshot(stepInfo, 'completed');
      this.emit('step:success', { runId: this.runId, step: stepInfo });
      return undefined;
    } catch (error) {
      if (error instanceof WorkflowSuspendedError) {
        this.markSnapshot(stepInfo, 'suspended', error.reason);
        this.emit('step:suspended', {
          runId: this.runId,
          step: stepInfo,
          reason: error.reason,
          data: error.data,
        });

        return {
          step: stepInfo,
          reason: error.reason,
          data: error.data,
          continue: async (resumeData: unknown) => {
            await this.captureTaskOutput(task, stepInfo, state, resumeData);
            this.markSnapshot(stepInfo, 'completed');
            this.emit('step:success', { runId: this.runId, step: stepInfo });
            return undefined;
          },
        };
      }

      this.markSnapshot(
        stepInfo,
        'failed',
        error instanceof Error ? error.message : String(error),
      );
      this.emit('step:error', { runId: this.runId, step: stepInfo, error });
      throw error;
    } finally {
      this.currentStep = undefined;
    }
  }

  private async captureTaskOutput(
    task: CompiledTask,
    stepInfo: StepInfo,
    state: ExecutionState,
    result: unknown,
  ) {
    // Map task outputs through expressions; fall back to raw result when no mapping is provided.
    const scope: EvaluationScope = {
      input: state.input,
      context: this.context as BaseWorkflowContext,
      memory: state.memory,
      output: state.output,
      iteration: state.iteration,
      accumulator: state.accumulator,
      result,
    };

    const mapped = await evaluateMapping(task.outputs, scope);
    state.output[task.name] = Object.keys(mapped).length > 0 ? mapped : result;
  }

  /**
   * Execute a parallel block sequentially to maintain determinism while obeying wait_any/wait_all semantics.
   * Suspension continuations resume the remaining work from the current index.
   */
  private async executeParallel(
    step: ParallelStep,
    state: ExecutionState,
    path: Array<number | string>,
    startIndex = 0,
  ): Promise<Suspension | void> {
    // Steps are executed sequentially to keep evaluation order deterministic; strategy controls early exit.
    for (let index = startIndex; index < step.steps.length; index += 1) {
      const child = step.steps[index];
      const suspension = await this.executeStep(child, state, [...path, index]);
      if (suspension) {
        return {
          ...suspension,
          continue: async (resumeData: unknown) => {
            const next = await suspension.continue(resumeData);
            if (next) {
              return next;
            }

            if (step.strategy === 'wait_any') {
              return undefined;
            }

            return this.executeParallel(step, state, path, index + 1);
          },
        };
      }

      if (step.strategy === 'wait_any') {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Evaluate branches until one matches and run its nested steps.
   * Only the first truthy branch executes.
   */
  private async executeConditional(
    step: ConditionalStep,
    state: ExecutionState,
    path: Array<number | string>,
  ): Promise<Suspension | void> {
    if (!this.context) {
      throw new Error('Workflow context is not attached.');
    }

    for (let index = 0; index < step.branches.length; index += 1) {
      const branch = step.branches[index];
      const scope: EvaluationScope = {
        input: state.input,
        context: this.context,
        memory: state.memory,
        output: state.output,
        iteration: state.iteration,
        accumulator: state.accumulator,
      };

      const conditionResult =
        branch.condition !== undefined
          ? await evaluateValue(branch.condition, scope)
          : true;

      if (conditionResult) {
        // Execute only the first matching branch.
        const suspension = await this.executeFlow(branch.steps, state, [
          ...path,
          'branch',
          index,
        ]);

        if (suspension) {
          return {
            ...suspension,
            continue: async (resumeData: unknown) => {
              const next = await suspension.continue(resumeData);
              if (next) {
                return next;
              }
              return undefined;
            },
          };
        }

        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Iterate through items produced by `forEach`, optionally aggregating values,
   * and resume mid-loop when a child suspends.
   */
  private async executeLoop(
    step: LoopStep,
    state: ExecutionState,
    path: Array<number | string>,
    startIndex = 0,
  ): Promise<Suspension | void> {
    if (!this.context) {
      throw new Error('Workflow context is not attached.');
    }

    const scope: EvaluationScope = {
      input: state.input,
      context: this.context,
      memory: state.memory,
      output: state.output,
      iteration: state.iteration,
      accumulator: state.accumulator,
    };

    const items = await evaluateValue(step.forEach.in, scope);
    const iterable = Array.isArray(items) ? items : [];
    let accumulator = step.accumulate?.initial ?? state.accumulator;

    // Iterate through evaluated items; accumulator and iterationStack are threaded through.
    for (let index = startIndex; index < iterable.length; index += 1) {
      const item = iterable[index];
      const iterationState: ExecutionState = {
        ...state,
        iteration: { item, index },
        accumulator,
        iterationStack: [...state.iterationStack, index],
      };

      const suspension = await this.executeFlow(step.steps, iterationState, [
        ...path,
        index,
      ]);

      if (suspension) {
        return {
          ...suspension,
          continue: async (resumeData: unknown) => {
            const next = await suspension.continue(resumeData);
            if (next) {
              return next;
            }

            const postScope: EvaluationScope = {
              input: iterationState.input,
              context: this.context as BaseWorkflowContext,
              memory: iterationState.memory,
              output: iterationState.output,
              iteration: { item, index },
              accumulator,
            };

            accumulator = await this.updateAccumulator(
              step,
              postScope,
              accumulator,
            );

            const shouldStop = await this.shouldStopLoop(step, postScope);
            if (shouldStop) {
              state.accumulator = accumulator;
              if (step.accumulate && step.name) {
                state.output[step.name] = { [step.accumulate.as]: accumulator };
              }
              return undefined;
            }

            return this.executeLoop(
              step,
              {
                ...iterationState,
                accumulator,
                iterationStack: state.iterationStack,
              },
              path,
              index + 1,
            );
          },
        };
      }

      const postScope: EvaluationScope = {
        input: iterationState.input,
        context: this.context as BaseWorkflowContext,
        memory: iterationState.memory,
        output: iterationState.output,
        iteration: { item, index },
        accumulator,
      };

      accumulator = await this.updateAccumulator(step, postScope, accumulator);

      const shouldStop = await this.shouldStopLoop(step, postScope);
      if (shouldStop) {
        break;
      }

      state.output = iterationState.output;
    }

    if (step.accumulate && step.name) {
      state.output[step.name] = { [step.accumulate.as]: accumulator };
    }

    if (step.accumulate) {
      state.accumulator = accumulator;
    }

    return undefined;
  }

  private async updateAccumulator(
    step: LoopStep,
    scope: EvaluationScope,
    previous: unknown,
  ): Promise<unknown> {
    if (!step.accumulate) {
      return previous;
    }

    return evaluateValue(step.accumulate.merge, {
      ...scope,
      accumulator: previous,
    });
  }

  /** Evaluate the loop `until` condition, defaulting to false when not provided. */
  private async shouldStopLoop(
    step: LoopStep,
    scope: EvaluationScope,
  ): Promise<boolean> {
    if (!step.until) {
      return false;
    }

    const result = await evaluateValue(step.until, scope);
    return Boolean(result);
  }
}
