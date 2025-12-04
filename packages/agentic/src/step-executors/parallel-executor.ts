import type {
  ExecutionState,
  ParallelStep,
  Suspension,
} from '../workflow-types';
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
    const suspension = await env.executeStep(child, state, [...path, index]);
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

          return executeParallel(env, step, state, path, index + 1);
        },
      };
    }

    if (step.strategy === 'wait_any') {
      return undefined;
    }
  }

  return undefined;
}
