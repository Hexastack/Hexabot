/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EWorkflowRunStatus, StepType } from "@hexabot-ai/agentic";
import type { StepExecutionRecord } from "@hexabot-ai/agentic";
import type { WorkflowRun } from "@hexabot-ai/types";
import { describe, expect, it } from "vitest";

import type { SubscribeWorkflowProps } from "@/websocket/types/workflow.types";

import {
  isWorkflowRunLiveEventForDebugger,
  mergeWorkflowRunLiveEvent,
  shouldWorkflowRunLiveEventTouchQuery,
} from "./live-workflow-run.utils";

const workflowId = "workflow-1";
const initiatorId = "user-1";
const runId = "run-1";
const buildRun = (overrides: Partial<WorkflowRun> = {}): WorkflowRun =>
  ({
    id: runId,
    createdAt: new Date(1000),
    updatedAt: new Date(1000),
    status: EWorkflowRunStatus.IDLE,
    workflow: workflowId,
    workflowVersion: null,
    triggeredBy: initiatorId,
    parentRun: null,
    input: {},
    output: null,
    context: {},
    snapshot: null,
    stepLog: null,
    suspendedStep: null,
    suspensionReason: null,
    suspensionData: null,
    suspensionStepExecId: null,
    suspensionIndex: null,
    suspensionKey: null,
    suspensionAwaitResults: null,
    lastResumeData: null,
    error: null,
    suspendedAt: null,
    finishedAt: null,
    failedAt: null,
    duration: null,
    metadata: null,
    ...overrides,
  }) as WorkflowRun;
const buildEvent = (
  overrides: Partial<SubscribeWorkflowProps>,
): SubscribeWorkflowProps =>
  ({
    runId,
    workflowId,
    initiatorId,
    workflowRun: buildRun(),
    workflowEvent: "workflow:start",
    t: 2000,
    ...overrides,
  }) as SubscribeWorkflowProps;
const buildStepExecution = (
  overrides: Partial<StepExecutionRecord> = {},
): StepExecutionRecord => ({
  id: "0:greet",
  name: "greet",
  action: "greet",
  status: "running",
  startedAt: 2100,
  input: { name: "Ada" },
  ...overrides,
});

describe("live workflow run utils", () => {
  it("merges a manual run event sequence into the WorkflowRun cache model", () => {
    const started = mergeWorkflowRunLiveEvent(
      undefined,
      buildEvent({ workflowEvent: "workflow:start", t: 2000 }),
    );
    const stepStarted = mergeWorkflowRunLiveEvent(
      started,
      buildEvent({
        workflowEvent: "step:start",
        t: 2100,
        step: { id: "0:greet", name: "greet", type: StepType.Task },
        stepExecution: buildStepExecution(),
      }),
    );
    const stepFinished = mergeWorkflowRunLiveEvent(
      stepStarted,
      buildEvent({
        workflowEvent: "step:success",
        t: 2400,
        step: { id: "0:greet", name: "greet", type: StepType.Task },
        stepExecution: buildStepExecution({
          status: "completed",
          endedAt: 2400,
          output: { ok: true },
        }),
      }),
    );
    const finished = mergeWorkflowRunLiveEvent(
      stepFinished,
      buildEvent({ workflowEvent: "workflow:finish", t: 2500 }),
    );

    expect(finished?.status).toBe(EWorkflowRunStatus.FINISHED);
    expect(finished?.workflow).toBe(workflowId);
    expect(finished?.triggeredBy).toBe(initiatorId);
    expect(finished?.finishedAt).toEqual(new Date(2500));
    expect(finished?.stepLog?.["0:greet"]).toEqual(
      expect.objectContaining({
        id: "0:greet",
        status: "completed",
        input: { name: "Ada" },
        output: { ok: true },
      }),
    );
  });

  it("merges scheduled workflow suspension events live", () => {
    const scheduledWorkflowId = "scheduled-workflow";
    const scheduledRun = buildRun({
      workflow: scheduledWorkflowId,
      input: { schedule: "*/5 * * * * *" },
    });
    const suspended = mergeWorkflowRunLiveEvent(
      scheduledRun,
      buildEvent({
        workflowId: scheduledWorkflowId,
        workflowRun: scheduledRun,
        workflowEvent: "step:suspended",
        t: 3000,
        step: { id: "0:await", name: "await", type: StepType.Task },
        stepExecution: buildStepExecution({
          id: "0:await",
          name: "await",
          status: "suspended",
          endedAt: 3000,
          reason: "waiting",
        }),
      }),
    );

    expect(suspended?.status).toBe(EWorkflowRunStatus.SUSPENDED);
    expect(suspended?.suspendedAt).toEqual(new Date(3000));
    expect(suspended?.stepLog?.["0:await"]).toEqual(
      expect.objectContaining({
        status: "suspended",
        reason: "waiting",
      }),
    );
  });

  it("merges cancelled step events without marking the run terminal", () => {
    const runningRun = buildRun({
      status: EWorkflowRunStatus.RUNNING,
      stepLog: {
        "0:slow_branch": buildStepExecution({
          id: "0:slow_branch",
          name: "slow_branch",
          status: "running",
        }),
      },
    });
    const updated = mergeWorkflowRunLiveEvent(
      runningRun,
      buildEvent({
        workflowRun: runningRun,
        workflowEvent: "step:cancelled",
        t: 3200,
        step: { id: "0:slow_branch", name: "slow_branch", type: StepType.Task },
        stepExecution: buildStepExecution({
          id: "0:slow_branch",
          name: "slow_branch",
          status: "cancelled",
          endedAt: 3200,
          error: { message: "Parallel wait_any branch lost the race." },
        }),
      }),
    );

    expect(updated?.status).toBe(EWorkflowRunStatus.RUNNING);
    expect(updated?.stepLog?.["0:slow_branch"]).toEqual(
      expect.objectContaining({
        status: "cancelled",
        error: { message: "Parallel wait_any branch lost the race." },
      }),
    );
  });

  it("filters and touches only matching debugger workflow run collections", () => {
    const event = buildEvent({ workflowEvent: "step:start" });

    expect(
      isWorkflowRunLiveEventForDebugger(event, workflowId, initiatorId),
    ).toBe(true);
    expect(
      isWorkflowRunLiveEventForDebugger(event, "other-workflow", initiatorId),
    ).toBe(false);
    expect(
      shouldWorkflowRunLiveEventTouchQuery(
        [
          "collection",
          "WorkflowRun",
          JSON.stringify({
            params: {
              where: {
                "workflow.id": workflowId,
                "triggeredBy.id": initiatorId,
              },
            },
          }),
        ],
        event,
      ),
    ).toBe(true);
  });
});
