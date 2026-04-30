/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  ExecutionState,
  ParallelStep,
  Suspension,
} from '../workflow-types';

import { markStepsSkipped } from './skip-helpers';
import { wrapSuspensionContinuation } from './suspension-continuation';
import type { StepExecutorEnv } from './types';

/**
 * Execute a set of steps in parallel order, respecting the configured strategy.
 *
 * @param env Executor environment providing helpers and workflow context.
 * @param step The parallel step definition including strategy and children.
 * @param state Mutable workflow execution state.
 * @param path Path tokens locating this parallel block in the workflow.
 * @param startIndex Index to resume execution from when continuing.
 * @returns A suspension if a child pauses execution, otherwise void.
 */
export async function executeParallel(
  env: StepExecutorEnv,
  step: ParallelStep,
  state: ExecutionState,
  path: Array<number | string>,
  startIndex = 0,
): Promise<Suspension | void> {
  for (let index = startIndex; index < step.steps.length; index += 1) {
    const child = step.steps[index];
    const childPath = [...path, 'parallel', index];
    const suspension = await env.executeStep(child, state, childPath);
    if (suspension) {
      return wrapSuspensionContinuation(suspension, async () => {
        if (step.strategy === 'wait_any') {
          if (index + 1 < step.steps.length) {
            markStepsSkipped(
              env,
              step.steps.slice(index + 1),
              state.iterationStack,
            );
          }

          return undefined;
        }

        return executeParallel(env, step, state, path, index + 1);
      });
    }

    if (step.strategy === 'wait_any') {
      if (index + 1 < step.steps.length) {
        markStepsSkipped(
          env,
          step.steps.slice(index + 1),
          state.iterationStack,
        );
      }

      return undefined;
    }
  }

  return undefined;
}
