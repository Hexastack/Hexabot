/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { EIndicatorType } from "@hexabot-ai/graph";
import { describe, expect, it } from "vitest";

import type { SubscribeWorkflowProps } from "../types/workflow.types";

import {
  START_INDICATOR_FINISH_DELAY_MS,
  STEP_SUCCESS_FINISH_DELAY_MS,
  WORKFLOW_FINISH_DELAY_MS,
  WORKFLOW_RESET_DELAY_MS,
  isStepWorkflowEvent,
  isWorkflowEventForFlow,
  mapWorkflowEventToExecutionActions,
} from "./workflow-execution-events.utils";

const stepInfo = {
  id: "0:send_message",
  name: "send_message",
  type: StepType.Task,
};
const workflowStartEvent: SubscribeWorkflowProps = {
  workflowEvent: "workflow:start",
  workflowId: "flow-1",
  runId: "run-1",
  t: 100,
};
const stepStartEvent: SubscribeWorkflowProps = {
  workflowEvent: "step:start",
  workflowId: "flow-1",
  runId: "run-1",
  t: 110,
  step: stepInfo,
};
const stepSuccessEvent: SubscribeWorkflowProps = {
  ...stepStartEvent,
  workflowEvent: "step:success",
  t: 120,
};
const stepCancelledEvent: SubscribeWorkflowProps = {
  ...stepStartEvent,
  workflowEvent: "step:cancelled",
  t: 125,
};
const loopStepStartEvent: SubscribeWorkflowProps = {
  ...stepStartEvent,
  t: 130,
  step: {
    ...stepInfo,
    id: "0.iterate.0:send_message[2.4]",
  },
};
const loopStepSuccessEvent: SubscribeWorkflowProps = {
  ...loopStepStartEvent,
  workflowEvent: "step:success",
  t: 140,
};
const workflowFinishEvent: SubscribeWorkflowProps = {
  workflowEvent: "workflow:finish",
  workflowId: "flow-1",
  runId: "run-1",
  t: 200,
  output: {},
};

describe("workflow-execution-events.utils", () => {
  it("maps workflow start to workflow start indicator", () => {
    expect(mapWorkflowEventToExecutionActions(workflowStartEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "start",
        t: 100,
      },
    ]);
  });

  it("maps step start to start-indicator finish and step start", () => {
    expect(mapWorkflowEventToExecutionActions(stepStartEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "finish",
        delayMs: START_INDICATOR_FINISH_DELAY_MS,
      },
      {
        type: "append",
        key: "0:send_message",
        state: "start",
        t: 110,
      },
    ]);
  });

  it("maps step success to delayed step finish transition", () => {
    expect(mapWorkflowEventToExecutionActions(stepSuccessEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "finish",
        delayMs: START_INDICATOR_FINISH_DELAY_MS,
      },
      {
        type: "append",
        key: "0:send_message",
        state: "finish",
        delayMs: STEP_SUCCESS_FINISH_DELAY_MS,
      },
    ]);
  });

  it("maps step cancellation to a cancelled state", () => {
    expect(mapWorkflowEventToExecutionActions(stepCancelledEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "finish",
        delayMs: START_INDICATOR_FINISH_DELAY_MS,
      },
      {
        type: "append",
        key: "0:send_message",
        state: "cancelled",
        t: 125,
      },
    ]);
  });

  it("normalizes loop iteration step ids before updating execution state", () => {
    expect(mapWorkflowEventToExecutionActions(loopStepStartEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "finish",
        delayMs: START_INDICATOR_FINISH_DELAY_MS,
      },
      {
        type: "append",
        key: "0.iterate.0:send_message",
        state: "start",
        t: 130,
      },
    ]);
  });

  it("applies loop step success immediately to avoid overriding next iteration state", () => {
    expect(mapWorkflowEventToExecutionActions(loopStepSuccessEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_START,
        state: "finish",
        delayMs: START_INDICATOR_FINISH_DELAY_MS,
      },
      {
        type: "append",
        key: "0.iterate.0:send_message",
        state: "finish",
        t: 140,
      },
    ]);
  });

  it("maps workflow finish to end indicator transitions then reset", () => {
    expect(mapWorkflowEventToExecutionActions(workflowFinishEvent)).toEqual([
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_END,
        state: "start",
        t: 200,
      },
      {
        type: "append",
        key: EIndicatorType.WORKFLOW_END,
        state: "finish",
        delayMs: WORKFLOW_FINISH_DELAY_MS,
      },
      {
        type: "clear",
        delayMs: WORKFLOW_RESET_DELAY_MS,
      },
    ]);
  });

  it("filters workflow events by active workflow id", () => {
    expect(isWorkflowEventForFlow(workflowStartEvent, "flow-1")).toBe(true);
    expect(isWorkflowEventForFlow(workflowStartEvent, "flow-2")).toBe(false);
    expect(isWorkflowEventForFlow(workflowStartEvent, undefined)).toBe(false);
    expect(
      isWorkflowEventForFlow(
        {
          ...workflowStartEvent,
          workflowId: undefined,
        },
        undefined,
      ),
    ).toBe(true);
  });

  it("detects step events that include a valid step id", () => {
    expect(isStepWorkflowEvent(stepStartEvent)).toBe(true);
    expect(isStepWorkflowEvent(workflowStartEvent)).toBe(false);
    expect(
      isStepWorkflowEvent({
        ...stepStartEvent,
        step: {
          ...stepInfo,
          id: "",
        },
      }),
    ).toBe(false);
  });
});
