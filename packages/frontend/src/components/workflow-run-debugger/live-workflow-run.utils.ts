/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EWorkflowRunStatus } from "@hexabot-ai/agentic";
import type { WorkflowRun } from "@hexabot-ai/types";

import {
  mergeEntityCachePayload,
  mergeStepExecutionRecord,
  type CacheRecord,
} from "@/hooks/entity-cache.utils";
import { EntityType, QueryType } from "@/services/types";
import type { SubscribeWorkflowProps } from "@/websocket/types/workflow.types";

import { resolveEntityId } from "./utils";

const WORKFLOW_EVENT_STATUS: Partial<Record<string, EWorkflowRunStatus>> = {
  "workflow:start": EWorkflowRunStatus.RUNNING,
  "workflow:finish": EWorkflowRunStatus.FINISHED,
  "workflow:failure": EWorkflowRunStatus.FAILED,
  "workflow:suspended": EWorkflowRunStatus.SUSPENDED,
  "step:start": EWorkflowRunStatus.RUNNING,
  "step:error": EWorkflowRunStatus.FAILED,
  "step:suspended": EWorkflowRunStatus.SUSPENDED,
};

type ParsedCollectionParams = {
  params?: {
    where?: Record<string, unknown>;
  };
  where?: Record<string, unknown>;
};

const toEventDate = (event: SubscribeWorkflowProps) =>
  typeof event.t === "number" ? new Date(event.t) : new Date();
const getWorkflowRunIdFromEvent = (
  event: SubscribeWorkflowProps,
): string | undefined => event.workflowRun?.id ?? event.runId;
const getWorkflowIdFromEvent = (
  event: SubscribeWorkflowProps,
): string | undefined =>
  event.workflowId ?? resolveEntityId(event.workflowRun?.workflow);
const getInitiatorIdFromEvent = (
  event: SubscribeWorkflowProps,
): string | undefined =>
  event.initiatorId ?? resolveEntityId(event.workflowRun?.triggeredBy);

export const isWorkflowRunLiveEventForDebugger = (
  event: SubscribeWorkflowProps,
  workflowId?: string,
  initiatorId?: string,
) => {
  const eventRunId = getWorkflowRunIdFromEvent(event);

  if (!eventRunId) {
    return false;
  }

  const eventWorkflowId = getWorkflowIdFromEvent(event);

  if (workflowId && eventWorkflowId && eventWorkflowId !== workflowId) {
    return false;
  }

  const eventInitiatorId = getInitiatorIdFromEvent(event);

  if (initiatorId && eventInitiatorId && eventInitiatorId !== initiatorId) {
    return false;
  }

  return true;
};

export const mergeWorkflowRunLiveEvent = (
  previousRun: WorkflowRun | undefined,
  event: SubscribeWorkflowProps,
): WorkflowRun | undefined => {
  const runId = getWorkflowRunIdFromEvent(event);

  if (!runId) {
    return previousRun;
  }

  const eventDate = toEventDate(event);
  const eventWorkflowRun = event.workflowRun
    ? mergeEntityCachePayload(
        EntityType.WORKFLOW_RUN,
        previousRun as CacheRecord | undefined,
        event.workflowRun as unknown as CacheRecord,
      )
    : {};
  const status = WORKFLOW_EVENT_STATUS[event.workflowEvent];
  const nextRun: CacheRecord = {
    ...(previousRun as unknown as CacheRecord | undefined),
    ...eventWorkflowRun,
    id: runId,
    ...(event.workflowId ? { workflow: event.workflowId } : {}),
    ...(event.initiatorId ? { triggeredBy: event.initiatorId } : {}),
    ...(event.threadId ? { thread: event.threadId } : {}),
    updatedAt: eventDate,
    ...(status ? { status } : {}),
  };

  if (event.workflowEvent === "workflow:finish") {
    nextRun.finishedAt = eventDate;
  }

  if (event.workflowEvent === "workflow:failure") {
    nextRun.failedAt = eventDate;
  }

  if (
    event.workflowEvent === "workflow:suspended" ||
    event.workflowEvent === "step:suspended"
  ) {
    nextRun.suspendedAt = eventDate;
  }

  if (event.stepExecution) {
    const previousStepLog =
      typeof nextRun.stepLog === "object" && nextRun.stepLog !== null
        ? (nextRun.stepLog as WorkflowRun["stepLog"])
        : {};

    nextRun.stepLog = {
      ...(previousStepLog ?? {}),
      [event.stepExecution.id]: mergeStepExecutionRecord(
        previousStepLog?.[event.stepExecution.id],
        event.stepExecution,
      ),
    };
  }

  return nextRun as WorkflowRun;
};

const parseCollectionParams = (
  queryParams: unknown,
): ParsedCollectionParams => {
  if (typeof queryParams !== "string") {
    return {};
  }

  try {
    const parsed = JSON.parse(queryParams);

    return typeof parsed === "object" && parsed !== null
      ? (parsed as ParsedCollectionParams)
      : {};
  } catch {
    return {};
  }
};

export const shouldWorkflowRunLiveEventTouchQuery = (
  queryKey: readonly unknown[],
  event: SubscribeWorkflowProps,
) => {
  const [queryType, queryEntity, queryParams] = queryKey;

  if (
    queryType !== QueryType.collection ||
    queryEntity !== EntityType.WORKFLOW_RUN
  ) {
    return false;
  }

  const params = parseCollectionParams(queryParams);
  const where = params.params?.where ?? params.where;

  if (!where) {
    return true;
  }

  const workflowFilter = where["workflow.id"];

  if (
    typeof workflowFilter === "string" &&
    workflowFilter !== getWorkflowIdFromEvent(event)
  ) {
    return false;
  }

  const initiatorFilter = where["triggeredBy.id"];

  if (
    typeof initiatorFilter === "string" &&
    initiatorFilter !== getInitiatorIdFromEvent(event)
  ) {
    return false;
  }

  return true;
};
