/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  EvaluationScope,
  ExecutionState,
  ForEachLoopStep,
  LoopStep,
  Suspension,
  WhileLoopStep,
} from '../workflow-types';
import { evaluateValue } from '../workflow-values';

import type { StepExecutorEnv } from './types';

type LoopScope = EvaluationScope;

/**
 * Execute a loop step by iterating over input items and executing child steps.
 *
 * @param env Executor environment with helpers and workflow context.
 * @param step The loop step configuration.
 * @param state Mutable workflow execution state.
 * @param path Path tokens locating this loop within the workflow.
 * @param startIndex Index to resume iteration from when continuing.
 * @returns A suspension if a child step pauses execution, otherwise void.
 */
export async function executeLoop(
  env: StepExecutorEnv,
  step: LoopStep,
  state: ExecutionState,
  path: Array<number | string>,
  startIndex = 0,
): Promise<Suspension | void> {
  if (step.loopType === 'for_each') {
    return executeForEachLoop(env, step, state, path, startIndex);
  }

  return executeWhileLoop(env, step, state, path, startIndex);
}

async function executeForEachLoop(
  env: StepExecutorEnv,
  step: ForEachLoopStep,
  state: ExecutionState,
  path: Array<number | string>,
  startIndex: number,
): Promise<Suspension | void> {
  const scope = {
    input: state.input,
    context: env.context.state,
    output: state.output,
    iteration: state.iteration,
    accumulator: state.accumulator,
  };
  const items = await evaluateValue(step.forEach.in, scope);
  const iterable = Array.isArray(items) ? items : [];
  let accumulator = step.accumulate?.initial ?? state.accumulator;

  for (let index = startIndex; index < iterable.length; index += 1) {
    const item = iterable[index];
    const iterationState: ExecutionState = {
      ...state,
      iteration: { item, index },
      accumulator,
      iterationStack: [...state.iterationStack, index],
    };
    const suspension = await env.executeFlow(step.steps, iterationState, [
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

          const postScope = buildScope(
            env,
            iterationState,
            { item, index },
            accumulator,
          );
          accumulator = await updateAccumulator(step, postScope, accumulator);

          const shouldStop = await shouldStopLoop(step, postScope);
          if (shouldStop) {
            state.accumulator = accumulator;
            if (step.accumulate && step.name) {
              state.output[step.name] = { [step.accumulate.as]: accumulator };
            }

            return undefined;
          }

          return executeForEachLoop(
            env,
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

    const postScope = buildScope(
      env,
      iterationState,
      { item, index },
      accumulator,
    );

    accumulator = await updateAccumulator(step, postScope, accumulator);

    const shouldStop = await shouldStopLoop(step, postScope);
    if (shouldStop) {
      break;
    }

    state.output = iterationState.output;
  }

  finalizeAccumulatorState(step, state, accumulator);

  return undefined;
}

async function executeWhileLoop(
  env: StepExecutorEnv,
  step: WhileLoopStep,
  state: ExecutionState,
  path: Array<number | string>,
  startIndex: number,
): Promise<Suspension | void> {
  let accumulator = step.accumulate?.initial ?? state.accumulator;

  for (let index = startIndex; ; index += 1) {
    const conditionScope = buildScope(
      env,
      state,
      { item: undefined, index },
      accumulator,
    );
    const shouldContinue = await evaluateValue(step.while, conditionScope);
    if (!Boolean(shouldContinue)) {
      break;
    }

    const iterationState: ExecutionState = {
      ...state,
      iteration: { item: undefined, index },
      accumulator,
      iterationStack: [...state.iterationStack, index],
    };
    const suspension = await env.executeFlow(step.steps, iterationState, [
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

          const postScope = buildScope(
            env,
            iterationState,
            { item: undefined, index },
            accumulator,
          );
          accumulator = await updateAccumulator(step, postScope, accumulator);

          return executeWhileLoop(
            env,
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

    const postScope = buildScope(
      env,
      iterationState,
      { item: undefined, index },
      accumulator,
    );

    accumulator = await updateAccumulator(step, postScope, accumulator);
    state.output = iterationState.output;
  }

  finalizeAccumulatorState(step, state, accumulator);

  return undefined;
}

function finalizeAccumulatorState(
  step: LoopStep,
  state: ExecutionState,
  accumulator: unknown,
): void {
  if (step.accumulate && step.name) {
    state.output[step.name] = { [step.accumulate.as]: accumulator };
  }

  if (step.accumulate) {
    state.accumulator = accumulator;
  }
}

/**
 * Update the loop accumulator using the configured merge expression.
 *
 * @param step The loop step containing accumulation settings.
 * @param scope Current evaluation scope for expressions.
 * @param previous Previous accumulator value to merge with.
 * @returns The updated accumulator value.
 */
export async function updateAccumulator(
  step: LoopStep,
  scope: LoopScope,
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

/**
 * Determine whether loop execution should stop based on the `until` condition.
 *
 * @param step The loop step configuration.
 * @param scope Current evaluation scope for expressions.
 * @returns True if the loop should stop, otherwise false.
 */
export async function shouldStopLoop(
  step: LoopStep,
  scope: LoopScope,
): Promise<boolean> {
  if (step.loopType !== 'for_each' || !step.until) {
    return false;
  }

  const result = await evaluateValue(step.until, scope);

  return Boolean(result);
}

/**
 * Build the evaluation scope for loop iteration and accumulator updates.
 *
 * @param env Executor environment with workflow context.
 * @param state Execution state for the current iteration.
 * @param iteration The current iteration item and index.
 * @param accumulator Accumulator value to expose to expressions.
 * @returns An evaluation scope object.
 */
function buildScope(
  env: StepExecutorEnv,
  state: ExecutionState,
  iteration: { item: unknown; index: number },
  accumulator: unknown,
): LoopScope {
  return {
    input: state.input,
    context: env.context.state,
    output: state.output,
    iteration,
    accumulator,
  };
}
