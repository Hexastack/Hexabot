import { evaluateValue } from '../workflow-values';
import type {
  ConditionalStep,
  ExecutionState,
  Suspension,
} from '../workflow-types';
import type { StepExecutorEnv } from './types';

/**
 * Evaluate a conditional step by checking branches in order and executing the first match.
 *
 * @param env Executor environment providing helpers and workflow context.
 * @param step The conditional step definition.
 * @param state Mutable workflow execution state.
 * @param path Path tokens locating this step within the workflow tree.
 * @returns A suspension if a branch pauses execution, otherwise void.
 */
export async function executeConditional(
  env: StepExecutorEnv,
  step: ConditionalStep,
  state: ExecutionState,
  path: Array<number | string>,
): Promise<Suspension | void> {
  for (let index = 0; index < step.branches.length; index += 1) {
    const branch = step.branches[index];
    const scope = {
      input: state.input,
      context: env.context.state,
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
      const suspension = await env.executeFlow(branch.steps, state, [
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
