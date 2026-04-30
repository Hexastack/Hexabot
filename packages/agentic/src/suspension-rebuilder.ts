/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ActionSnapshot, BaseWorkflowContext } from './context';
import {
  executeLoop as runLoopExecutor,
  shouldStopLoop,
  updateAccumulator,
} from './step-executors/loop-executor';
import { executeParallel as runParallelExecutor } from './step-executors/parallel-executor';
import { markStepsSkipped } from './step-executors/skip-helpers';
import { wrapSuspensionContinuation } from './step-executors/suspension-continuation';
import type { StepExecutorEnv } from './step-executors/types';
import {
  StepType,
  type StepInfo,
  type WorkflowEventMap,
} from './workflow-event-emitter';
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
  buildInstanceStepInfo: (
    step: CompiledStep,
    iterationStack: number[],
  ) => StepInfo;
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

type RebuildSuspensionMetadata = {
  stepExecId?: string;
  suspendIndex?: number;
  suspendKey?: string;
  reason?: string;
  awaitResults?: Record<string, unknown>;
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
    stepExecId,
    suspendIndex,
    suspendKey,
    awaitResults,
  }: {
    state?: ExecutionState;
    stepId: string;
    reason?: string;
    data?: unknown;
    stepExecId?: string;
    suspendIndex?: number;
    suspendKey?: string;
    awaitResults?: Record<string, unknown>;
  },
): Suspension | null {
  if (!state) {
    return null;
  }

  const { path, iterationStack } = parseSuspendedStepId(stepId);
  const executionState: ExecutionState = {
    ...state,
    iterationStack:
      iterationStack.length > 0 ? iterationStack : (state.iterationStack ?? []),
  };
  const suspensionMetadata: RebuildSuspensionMetadata = {
    stepExecId,
    suspendIndex,
    suspendKey,
    reason,
    awaitResults,
  };
  const suspension = buildSuspensionForPath(
    deps,
    deps.compiled.flow,
    executionState,
    path,
    [],
    0,
    suspensionMetadata,
  );

  if (!suspension) {
    return null;
  }

  return {
    ...suspension,
    reason,
    data,
    stepExecId,
    suspendIndex,
    suspendKey,
    awaitResults,
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
  suspensionMetadata: RebuildSuspensionMetadata = {},
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
    if (step.type !== StepType.Task) {
      return null;
    }

    const stepInfo = deps.buildInstanceStepInfo(step, state.iterationStack);
    const replayStepExecId =
      suspensionMetadata.stepExecId ?? `${stepInfo.id}#1`;
    const replaySuspension =
      suspensionMetadata.suspendIndex !== undefined ||
      suspensionMetadata.suspendKey !== undefined
        ? {
            suspendIndex: suspensionMetadata.suspendIndex,
            suspendKey: suspensionMetadata.suspendKey,
            reason: suspensionMetadata.reason,
          }
        : undefined;

    return {
      step: stepInfo,
      continue: async (resumeData: unknown) => {
        const executorEnv = deps.createExecutorEnv();
        const prepareStepReplay = (executorEnv as Partial<StepExecutorEnv>)
          .prepareStepReplay;
        const recordStepSuspendResult = (
          executorEnv as Partial<StepExecutorEnv>
        ).recordStepSuspendResult;
        const primeStepResumeData = (executorEnv as Partial<StepExecutorEnv>)
          .primeStepResumeData;
        const executeStep = (executorEnv as Partial<StepExecutorEnv>)
          .executeStep;

        if (typeof executeStep === 'function') {
          if (typeof prepareStepReplay === 'function') {
            prepareStepReplay({
              stepId: stepInfo.id,
              stepExecId: replayStepExecId,
              awaitResults: suspensionMetadata.awaitResults,
              activeSuspension: replaySuspension,
            });
          }

          if (
            typeof recordStepSuspendResult === 'function' &&
            replaySuspension
          ) {
            recordStepSuspendResult({
              stepId: stepInfo.id,
              stepExecId: replayStepExecId,
              suspendIndex: suspensionMetadata.suspendIndex,
              suspendKey: suspensionMetadata.suspendKey,
              resumeData,
            });
          } else if (typeof primeStepResumeData === 'function') {
            primeStepResumeData(stepInfo.id, resumeData);
          }

          const resumed = await executeStep(step, state, currentPath);
          if (resumed) {
            return wrapSuspensionContinuation(resumed, () =>
              deps.executeFlow(steps, state, pathPrefix, current + 1),
            );
          }

          return deps.executeFlow(steps, state, pathPrefix, current + 1);
        }

        const task = deps.compiled.tasks[step.taskName];
        if (!task) {
          throw new Error(`Task "${step.taskName}" is not defined.`);
        }
        await deps.captureTaskOutput(task, state, resumeData);
        deps.markSnapshot(stepInfo, 'completed');
        deps.emit('hook:step:success', { runId: deps.runId, step: stepInfo });

        return deps.executeFlow(steps, state, pathPrefix, current + 1);
      },
    };
  }

  if (step.type === StepType.Parallel) {
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
      suspensionMetadata,
    );

    if (!childSuspension) {
      return null;
    }

    const childIndex =
      typeof childPath[0] === 'number' ? (childPath[0] as number) : 0;

    return wrapSuspensionContinuation(childSuspension, async () => {
      if (step.strategy === 'wait_any') {
        if (childIndex + 1 < step.steps.length) {
          markStepsSkipped(
            env,
            step.steps.slice(childIndex + 1),
            state.iterationStack ?? [],
          );
        }

        return deps.executeFlow(steps, state, pathPrefix, current + 1);
      }

      const next = await runParallelExecutor(
        env,
        step,
        state,
        currentPath,
        childIndex + 1,
      );

      if (next) {
        return wrapSuspensionContinuation(next, () =>
          deps.executeFlow(steps, state, pathPrefix, current + 1),
        );
      }

      return deps.executeFlow(steps, state, pathPrefix, current + 1);
    });
  }

  if (step.type === StepType.Conditional) {
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
      suspensionMetadata,
    );

    if (!branchSuspension) {
      return null;
    }

    return wrapSuspensionContinuation(branchSuspension, () =>
      deps.executeFlow(steps, state, pathPrefix, current + 1),
    );
  }

  if (step.type === StepType.Loop) {
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

    const ancestorIterationStack = targetIterationStack.slice(
      0,
      iterationDepth,
    );
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
      suspensionMetadata,
    );

    if (!childSuspension) {
      return null;
    }

    const accumulator =
      iterationState.accumulator ?? state.accumulator ?? undefined;

    return wrapSuspensionContinuation(childSuspension, async () => {
      const scope: EvaluationScope = {
        input: iterationState.input,
        context: env.context.state,
        output: iterationState.output,
        iteration: iterationState.iteration ?? {
          item: undefined,
          index: iterationIndex,
        },
        accumulator,
      };
      const updatedAccumulator = await updateAccumulator(
        step,
        scope,
        accumulator,
      );
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
        return deps.executeFlow(steps, state, pathPrefix, current + 1);
      }

      const baseState: ExecutionState = {
        ...iterationState,
        iterationStack: ancestorIterationStack,
        accumulator: updatedAccumulator,
        output: state.output,
      };
      const next = await runLoopExecutor(
        env,
        step,
        baseState,
        currentPath,
        iterationIndex + 1,
      );

      state.output = baseState.output;
      if (step.accumulate) {
        state.accumulator = baseState.accumulator;
      }

      if (next) {
        return wrapSuspensionContinuation(next, async () => {
          state.output = baseState.output;
          if (step.accumulate) {
            state.accumulator = baseState.accumulator;
          }

          return deps.executeFlow(steps, state, pathPrefix, current + 1);
        });
      }

      return deps.executeFlow(steps, state, pathPrefix, current + 1);
    });
  }

  return null;
}
