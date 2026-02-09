/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowSuspendedError } from '../runtime-error';
import type {
  EvaluationScope,
  ExecutionState,
  Suspension,
  TaskStep,
} from '../workflow-types';
import { evaluateMapping } from '../workflow-values';

import type { StepExecutorEnv } from './types';

/**
 * Execute a task step by running its task and handling suspension or output mapping.
 *
 * @param env Executor environment with compiled workflow and helpers.
 * @param step The compiled task step to execute.
 * @param state Mutable workflow execution state.
 * @param _path Location of the step within the workflow (unused in this executor).
 * @returns A suspension if the task pauses execution, otherwise void.
 */
export async function executeTaskStep(
  env: StepExecutorEnv,
  step: TaskStep,
  state: ExecutionState,
  _path: Array<number | string>,
): Promise<Suspension | void> {
  void _path;
  const task = env.compiled.tasks[step.taskName];
  if (!task) {
    throw new Error(`Task "${step.taskName}" is not defined.`);
  }

  const stepInfo = env.buildInstanceStepInfo(step, state.iterationStack);
  const scope: EvaluationScope = {
    input: state.input,
    context: env.context.state,
    output: state.output,
    iteration: state.iteration,
    accumulator: state.accumulator,
  };
  const inputs = await evaluateMapping(task.inputs, scope);
  env.recordStepExecution(stepInfo, {
    action: task.actionName,
    status: 'running',
    startedAt: Date.now(),
    input: inputs,
    context: { before: env.context.snapshot() },
  });
  env.setCurrentStep(stepInfo);
  env.markSnapshot(stepInfo, 'running');
  env.emit('hook:step:start', { runId: env.runId, step: stepInfo });

  try {
    const result = await task.action.run(inputs, env.context, task.settings);
    await env.captureTaskOutput(task, state, result);
    env.recordStepExecution(stepInfo, {
      status: 'completed',
      endedAt: Date.now(),
      output: result,
      context: { after: env.context.snapshot() },
    });
    env.markSnapshot(stepInfo, 'completed');
    env.emit('hook:step:success', { runId: env.runId, step: stepInfo });

    return undefined;
  } catch (error) {
    if (error instanceof WorkflowSuspendedError) {
      env.recordStepExecution(stepInfo, {
        status: 'suspended',
        endedAt: Date.now(),
        reason: error.reason,
        context: { after: env.context.snapshot() },
      });
      env.markSnapshot(stepInfo, 'suspended', error.reason);
      env.emit('hook:step:suspended', {
        runId: env.runId,
        step: stepInfo,
        reason: error.reason,
        data: error.data,
      });

      return {
        step: stepInfo,
        reason: error.reason,
        data: error.data,
        continue: async (resumeData: unknown) => {
          await env.captureTaskOutput(task, state, resumeData);
          env.recordStepExecution(stepInfo, {
            status: 'completed',
            endedAt: Date.now(),
            output: resumeData,
            context: { after: env.context.snapshot() },
          });
          env.markSnapshot(stepInfo, 'completed');
          env.emit('hook:step:success', { runId: env.runId, step: stepInfo });

          return undefined;
        },
      };
    }

    env.recordStepExecution(stepInfo, {
      status: 'failed',
      endedAt: Date.now(),
      error: normalizeError(error),
      context: { after: env.context.snapshot() },
    });
    env.markSnapshot(stepInfo, 'failed', normalizeErrorMessage(error));
    env.emit('hook:step:error', { runId: env.runId, step: stepInfo, error });
    throw error;
  } finally {
    env.setCurrentStep(undefined);
  }
}

const normalizeError = (error: unknown): { message: string; stack?: string } =>
  error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error) };
const normalizeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
