/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export class WorkflowCancellationError extends Error {
  constructor(message = 'Workflow execution was cancelled.') {
    super(message);
    this.name = 'WorkflowCancellationError';
  }
}

export class ParallelSuspensionError extends Error {
  constructor() {
    super('workflow.suspend() is not supported inside a parallel block.');
    this.name = 'ParallelSuspensionError';
  }
}

export const isWorkflowCancellationError = (
  error: unknown,
): error is WorkflowCancellationError =>
  error instanceof WorkflowCancellationError ||
  (error instanceof Error && error.name === 'WorkflowCancellationError');

export const getAbortReason = (signal: AbortSignal): Error => {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }

  if (signal.reason !== undefined) {
    return new WorkflowCancellationError(String(signal.reason));
  }

  return new WorkflowCancellationError();
};

export const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw getAbortReason(signal);
  }
};
