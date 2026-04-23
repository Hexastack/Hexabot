/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  EWorkflowRunStatus,
  type WorkflowRunStatus,
} from '@hexabot-ai/agentic';

export const resolveTimestampMs = (
  value?: Date | string | null,
): number | null => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

export const resolveRunDurationMs = (run: {
  createdAt?: Date | string | null;
  finishedAt?: Date | string | null;
  failedAt?: Date | string | null;
  suspendedAt?: Date | string | null;
  status?: WorkflowRunStatus | null;
}): number | null => {
  const createdAtMs = resolveTimestampMs(run.createdAt);
  if (createdAtMs == null) {
    return null;
  }

  const endAtMs =
    resolveTimestampMs(run.finishedAt) ??
    resolveTimestampMs(run.failedAt) ??
    resolveTimestampMs(run.suspendedAt) ??
    (run.status === EWorkflowRunStatus.RUNNING ? Date.now() : null);

  if (endAtMs == null) {
    return null;
  }

  return Math.max(0, endAtMs - createdAtMs);
};
