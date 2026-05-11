/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getAbortReason, throwIfAborted } from '../errors';
import type { RuntimeSuspensionRequest } from '../runner-runtime-control';
import type {
  CompiledTask,
  EvaluationScope,
  ExecutionState,
  Suspension,
  TaskStep,
} from '../workflow-types';
import { evaluateMapping } from '../workflow-values';

import type { StepExecutorEnv } from './types';

type TaskProgressOutcome =
  | { type: 'completed'; value: unknown }
  | { type: 'failed'; error: unknown }
  | { type: 'cancelled'; error: Error }
  | { type: 'suspended'; request: RuntimeSuspensionRequest };

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
  if (env.signal.aborted) {
    const error = getAbortReason(env.signal);
    recordTaskCancellation(env, stepInfo, error);
    throw error;
  }

  const scope: EvaluationScope = {
    input: state.input,
    context: env.context.state,
    output: state.output,
    iteration: state.iteration,
    accumulator: state.accumulator,
  };
  const inputs = await evaluateMapping(task.inputs, scope);
  if (env.signal.aborted) {
    const error = getAbortReason(env.signal);
    recordTaskCancellation(env, stepInfo, error);
    throw error;
  }

  const stepExecution = env.recordStepExecution(stepInfo, {
    action: task.actionName,
    status: 'running',
    startedAt: Date.now(),
    input: inputs,
    context: { before: env.context.snapshot() },
  });
  env.beginStepExecution?.(stepInfo.id);
  env.setCurrentStep(stepInfo);
  env.markSnapshot(stepInfo, 'running');
  env.emit('hook:step:start', {
    runId: env.runId,
    step: stepInfo,
    stepExecution,
  });

  try {
    throwIfAborted(env.signal);

    const actionPromise = Promise.resolve().then(() =>
      task.action.run(
        inputs,
        env.context,
        task.settings,
        task.bindings,
        env.signal,
      ),
    );
    const outcome = await waitForTaskProgress(env, stepInfo.id, actionPromise);

    if (outcome.type === 'completed') {
      await completeTask(
        env,
        stepInfo.id,
        stepInfo,
        task,
        state,
        outcome.value,
      );

      return undefined;
    }

    if (outcome.type === 'failed') {
      env.clearStepSuspensions(stepInfo.id, outcome.error);
      recordTaskFailure(env, stepInfo, outcome.error);
      throw outcome.error;
    }

    if (outcome.type === 'cancelled') {
      env.clearStepSuspensions(stepInfo.id, outcome.error);
      recordTaskCancellation(env, stepInfo, outcome.error);
      throw outcome.error;
    }

    return buildSuspensionContinuation(
      env,
      stepInfo.id,
      stepInfo,
      task,
      state,
      actionPromise,
      outcome.request,
    );
  } finally {
    env.setCurrentStep(undefined);
  }
}

const waitForTaskProgress = async (
  env: StepExecutorEnv,
  stepId: string,
  actionPromise: Promise<unknown>,
): Promise<TaskProgressOutcome> => {
  const completion = actionPromise.then(
    (value): TaskProgressOutcome => ({ type: 'completed', value }),
    (error): TaskProgressOutcome => ({ type: 'failed', error }),
  );
  const suspension = env
    .waitForStepSuspension(stepId)
    .then<TaskProgressOutcome>((request) => ({ type: 'suspended', request }));
  let cleanupCancellation = () => undefined;
  const cancellation = new Promise<TaskProgressOutcome>((resolve) => {
    if (env.signal.aborted) {
      resolve({ type: 'cancelled', error: getAbortReason(env.signal) });

      return;
    }

    const onAbort = () => {
      resolve({ type: 'cancelled', error: getAbortReason(env.signal) });
    };

    env.signal.addEventListener('abort', onAbort, { once: true });
    cleanupCancellation = () => {
      env.signal.removeEventListener('abort', onAbort);
    };
  });

  try {
    return await Promise.race([completion, suspension, cancellation]);
  } finally {
    cleanupCancellation();
  }
};
const completeTask = async (
  env: StepExecutorEnv,
  stepId: string,
  stepInfo: Suspension['step'],
  task: CompiledTask,
  state: ExecutionState,
  result: unknown,
) => {
  await env.captureTaskOutput(task, state, result);
  const stepExecution = env.recordStepExecution(stepInfo, {
    status: 'completed',
    endedAt: Date.now(),
    output: result,
    context: { after: env.context.snapshot() },
  });
  env.markSnapshot(stepInfo, 'completed');
  env.emit('hook:step:success', {
    runId: env.runId,
    step: stepInfo,
    stepExecution,
  });
  env.clearStepSuspensions(stepId);
};
const recordSuspension = (
  env: StepExecutorEnv,
  stepInfo: Suspension['step'],
  reason?: string,
  data?: unknown,
) => {
  const stepExecution = env.recordStepExecution(stepInfo, {
    status: 'suspended',
    endedAt: Date.now(),
    reason,
    context: { after: env.context.snapshot() },
  });
  env.markSnapshot(stepInfo, 'suspended', reason);
  env.emit('hook:step:suspended', {
    runId: env.runId,
    step: stepInfo,
    stepExecution,
    reason,
    data,
  });
};
const buildSuspensionContinuation = (
  env: StepExecutorEnv,
  stepId: string,
  stepInfo: Suspension['step'],
  task: CompiledTask,
  state: ExecutionState,
  actionPromise: Promise<unknown>,
  request: RuntimeSuspensionRequest,
): Suspension => {
  recordSuspension(env, stepInfo, request.reason, request.data);

  let resumed = false;

  return {
    step: stepInfo,
    reason: request.reason,
    data: request.data,
    stepExecId: request.stepExecId,
    suspendIndex: request.suspendIndex,
    suspendKey: request.suspendKey,
    awaitResults: request.awaitResults,
    continue: async (resumeData: unknown) => {
      if (resumed) {
        throw new Error(
          `Suspension for step "${stepInfo.id}" has already been resumed.`,
        );
      }

      resumed = true;
      env.setCurrentStep(stepInfo);
      env.recordStepSuspendResult?.({
        stepId,
        stepExecId: request.stepExecId,
        suspendIndex: request.suspendIndex,
        suspendKey: request.suspendKey,
        resumeData,
      });
      request.resume.resolve(resumeData);

      let outcome: TaskProgressOutcome;
      try {
        outcome = await waitForTaskProgress(env, stepId, actionPromise);
      } finally {
        env.setCurrentStep(undefined);
      }

      if (outcome.type === 'suspended') {
        return buildSuspensionContinuation(
          env,
          stepId,
          stepInfo,
          task,
          state,
          actionPromise,
          outcome.request,
        );
      }

      if (outcome.type === 'completed') {
        await completeTask(env, stepId, stepInfo, task, state, outcome.value);

        return undefined;
      }

      env.clearStepSuspensions(stepId, outcome.error);
      recordTaskFailure(env, stepInfo, outcome.error);
      throw outcome.error;
    },
  };
};
const recordTaskFailure = (
  env: StepExecutorEnv,
  stepInfo: Suspension['step'],
  error: unknown,
) => {
  const normalizedError = normalizeError(error);
  const stepExecution = env.recordStepExecution(stepInfo, {
    status: 'failed',
    endedAt: Date.now(),
    error: normalizedError,
    context: { after: env.context.snapshot() },
  });
  env.markSnapshot(stepInfo, 'failed', normalizeErrorMessage(error));
  env.emit('hook:step:error', {
    runId: env.runId,
    step: stepInfo,
    stepExecution,
    error,
  });
};
const recordTaskCancellation = (
  env: StepExecutorEnv,
  stepInfo: Suspension['step'],
  error: unknown,
) => {
  const normalizedError = normalizeError(error);
  const stepExecution = env.recordStepExecution(stepInfo, {
    status: 'cancelled',
    endedAt: Date.now(),
    error: normalizedError,
    context: { after: env.context.snapshot() },
  });
  env.markSnapshot(stepInfo, 'cancelled', normalizeErrorMessage(error));
  env.emit('hook:step:cancelled', {
    runId: env.runId,
    step: stepInfo,
    stepExecution,
    error,
  });
};
const normalizeError = (error: unknown): { message: string; stack?: string } =>
  error instanceof Error
    ? { message: error.message, stack: error.stack }
    : { message: String(error) };
const normalizeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
