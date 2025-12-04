import type { ActionSnapshot, BaseWorkflowContext } from './context';
import {
  executeLoop as runLoopExecutor,
  shouldStopLoop,
  updateAccumulator,
} from './step-executors/loop-executor';
import { executeParallel as runParallelExecutor } from './step-executors/parallel-executor';
import type { StepExecutorEnv } from './step-executors/types';
import type { StepInfo, WorkflowEventMap } from './workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  EvaluationScope,
  ExecutionState,
  Suspension,
} from './workflow-types';

export type SuspensionRebuilderDeps = {
  compiled: CompiledWorkflow;
  context?: BaseWorkflowContext;
  runId?: string;
  createExecutorEnv: () => StepExecutorEnv;
  buildInstanceStepInfo: (step: CompiledStep, iterationStack: number[]) => StepInfo;
  captureTaskOutput: (
    task: CompiledTask,
    state: ExecutionState,
    result: unknown,
  ) => Promise<void>;
  markSnapshot: (
    step: StepInfo,
    status: ActionSnapshot['status'],
    reason?: string,
  ) => void;
  emit: <K extends keyof WorkflowEventMap>(
    event: K,
    payload: WorkflowEventMap[K],
  ) => void;
  executeFlow: (
    steps: CompiledStep[],
    state: ExecutionState,
    path: Array<number | string>,
    startIndex?: number,
  ) => Promise<Suspension | void>;
};

/**
 * Parse a suspended step id into its execution path and iteration stack.
 *
 * @param stepId The serialized step identifier stored in snapshots.
 * @returns The decoded path tokens and iteration stack.
 */
export function parseSuspendedStepId(stepId: string): {
  path: Array<number | string>;
  iterationStack: number[];
} {
  const iterationMatch = stepId.match(/^(.*)\[(.+)\]$/);
  const baseId = iterationMatch ? iterationMatch[1] : stepId;
  const iterationStack = iterationMatch
    ? iterationMatch[2]
        .split('.')
        .map((token) => Number.parseInt(token, 10))
        .filter((value) => !Number.isNaN(value))
    : [];
  const [pathPart] = baseId.split(':');
  const path =
    pathPart.length === 0 || pathPart === 'root'
      ? []
      : pathPart.split('.').map((token) => {
          const numeric = Number.parseInt(token, 10);
          return Number.isNaN(numeric) ? token : numeric;
        });

  return { path, iterationStack };
}

/**
 * Rebuild a suspension object based on persisted state and step identifiers.
 *
 * @param deps Dependencies needed to reconstruct executors and events.
 * @param param0 Persisted state and metadata about the suspended step.
 * @param param0.state Execution state captured at suspension time.
 * @param param0.stepId Serialized step id used to locate the suspension point.
 * @param param0.reason Optional reason supplied when the workflow suspended.
 * @param param0.data Arbitrary payload provided with the suspension.
 * @returns A suspension ready to be resumed, or null if reconstruction fails.
 */
export function rebuildSuspension(
  deps: SuspensionRebuilderDeps,
  {
    state,
    stepId,
    reason,
    data,
  }: {
    state?: ExecutionState;
    stepId: string;
    reason?: string;
    data?: unknown;
  },
): Suspension | null {
  if (!state) {
    return null;
  }

  const { path, iterationStack } = parseSuspendedStepId(stepId);
  const executionState: ExecutionState = {
    ...state,
    iterationStack:
      iterationStack.length > 0 ? iterationStack : state.iterationStack ?? [],
  };
  const suspension = buildSuspensionForPath(
    deps,
    deps.compiled.flow,
    executionState,
    path,
    [],
  );

  if (!suspension) {
    return null;
  }

  return {
    ...suspension,
    reason,
    data,
  };
}

/**
 * Walk the compiled flow to rebuild the continuation matching a target path.
 *
 * @param deps Dependencies for executor creation and event emission.
 * @param steps The steps to search for the suspended step.
 * @param state Mutable execution state to thread through the traversal.
 * @param targetPath Path tokens identifying the suspended step location.
 * @param pathPrefix Prefix accumulated while descending the tree.
 * @param iterationDepth Current loop depth to match iteration stacks.
 * @returns A rebuilt suspension or null if the path cannot be matched.
 */
export function buildSuspensionForPath(
  deps: SuspensionRebuilderDeps,
  steps: CompiledStep[],
  state: ExecutionState,
  targetPath: Array<number | string>,
  pathPrefix: Array<number | string>,
  iterationDepth = 0,
): Suspension | null {
  if (!deps.context) {
    throw new Error('Workflow context is not attached.');
  }

  const env = deps.createExecutorEnv();
  if (targetPath.length === 0) {
    return null;
  }

  const [current, ...rest] = targetPath;
  if (typeof current !== 'number') {
    return null;
  }

  const step = steps[current];
  const currentPath = [...pathPrefix, current];

  if (!step) {
    return null;
  }

  if (rest.length === 0) {
    if (step.kind !== 'do') {
      return null;
    }

    const stepInfo = deps.buildInstanceStepInfo(step, state.iterationStack);
    return {
      step: stepInfo,
      continue: async (resumeData: unknown) => {
        const task = deps.compiled.tasks[step.taskName];
        if (!task) {
          throw new Error(`Task "${step.taskName}" is not defined.`);
        }

        await deps.captureTaskOutput(task, state, resumeData);
        deps.markSnapshot(stepInfo, 'completed');
        deps.emit('step:success', { runId: deps.runId, step: stepInfo });
        return deps.executeFlow(steps, state, pathPrefix, current + 1);
      },
    };
  }

  if (step.kind === 'parallel') {
    if (rest[0] !== 'parallel') {
      return null;
    }

    const childPath = rest.slice(1);
    const childSuspension = buildSuspensionForPath(
      deps,
      step.steps,
      state,
      childPath,
      [...currentPath, 'parallel'],
      iterationDepth,
    );

    if (!childSuspension) {
      return null;
    }

    const childIndex =
      typeof childPath[0] === 'number' ? (childPath[0] as number) : 0;

    return {
      ...childSuspension,
      continue: async (resumeData: unknown) => {
        const next = await childSuspension.continue(resumeData);
        if (next) {
          return next;
        }

        if (step.strategy === 'wait_any') {
          return undefined;
        }

        return runParallelExecutor(env, step, state, currentPath, childIndex + 1);
      },
    };
  }

  if (step.kind === 'conditional') {
    if (rest[0] !== 'branch' || typeof rest[1] !== 'number') {
      return null;
    }

    const branchIndex = rest[1] as number;
    const childPath = rest.slice(2);
    const branch = step.branches[branchIndex];

    if (!branch) {
      return null;
    }

    const branchSuspension = buildSuspensionForPath(
      deps,
      branch.steps,
      state,
      childPath,
      [...currentPath, 'branch', branchIndex],
      iterationDepth,
    );

    if (!branchSuspension) {
      return null;
    }

    return {
      ...branchSuspension,
      continue: async (resumeData: unknown) => {
        const next = await branchSuspension.continue(resumeData);
        if (next) {
          return next;
        }

        return undefined;
      },
    };
  }

  if (step.kind === 'loop') {
    if (rest.length < 1 || typeof rest[0] !== 'string') {
      return null;
    }

    const loopToken = rest[0] as string;
    const childPath = rest.slice(1);
    const targetIterationStack = state.iterationStack ?? [];
    const iterationIndex =
      targetIterationStack[iterationDepth] ?? state.iteration?.index;

    if (iterationIndex === undefined) {
      return null;
    }

    const ancestorIterationStack = targetIterationStack.slice(0, iterationDepth);
    const iterationState: ExecutionState = {
      ...state,
      iterationStack: targetIterationStack,
      iteration:
        state.iteration ??
        ({
          item: undefined,
          index: iterationIndex,
        } satisfies ExecutionState['iteration']),
    };

    const childSuspension = buildSuspensionForPath(
      deps,
      step.steps,
      iterationState,
      childPath,
      [...currentPath, loopToken],
      iterationDepth + 1,
    );

    if (!childSuspension) {
      return null;
    }

    const accumulator = iterationState.accumulator ?? state.accumulator ?? undefined;

    return {
      ...childSuspension,
      continue: async (resumeData: unknown) => {
        const next = await childSuspension.continue(resumeData);
        if (next) {
          return next;
        }

        const scope: EvaluationScope = {
          input: iterationState.input,
          context: env.context as BaseWorkflowContext,
          memory: iterationState.memory,
          output: iterationState.output,
          iteration:
            iterationState.iteration ?? {
              item: undefined,
              index: iterationIndex,
            },
          accumulator,
        };

        const updatedAccumulator = await updateAccumulator(step, scope, accumulator);
        const shouldStop = await shouldStopLoop(step, scope);

        state.output = iterationState.output;

        if (step.accumulate && step.name) {
          state.output[step.name] = {
            [step.accumulate.as]: updatedAccumulator,
          };
        }

        if (step.accumulate) {
          state.accumulator = updatedAccumulator;
        }

        if (shouldStop) {
          return undefined;
        }

        const baseState: ExecutionState = {
          ...iterationState,
          iterationStack: ancestorIterationStack,
          accumulator: updatedAccumulator,
          output: state.output,
        };

        return runLoopExecutor(env, step, baseState, currentPath, iterationIndex + 1);
      },
    };
  }

  return null;
}
