/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { EIndicatorType } from "../types/workflow-node.types";

import { resolveNodeExecutionState } from "./execution-state.utils";

describe("execution-state.utils", () => {
  it("resolves using node id when available", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "node-1": [{ state: "start", t: 1 }],
        },
        nodeId: "node-1",
      }),
    ).toBe("start");
  });

  it("falls back to step id when node id has no state", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "0:send_message": [{ state: "finish", t: 10 }],
        },
        nodeId: "node-1",
        stepId: "0:send_message",
      }),
    ).toBe("finish");
  });

  it("falls back to indicator id when node and step states are missing", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          [EIndicatorType.WORKFLOW_START]: [{ state: "start", t: 2 }],
        },
        nodeId: "indicator:start",
        indicator: EIndicatorType.WORKFLOW_START,
      }),
    ).toBe("start");
  });

  it("merges all candidate timelines and keeps the most recent state", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "node-1": [{ state: "start", t: 1 }],
          "0:send_message": [{ state: "error", t: 4 }],
          [EIndicatorType.WORKFLOW_START]: [{ state: "finish", t: 8 }],
        },
        nodeId: "node-1",
        stepId: "0:send_message",
        indicator: EIndicatorType.WORKFLOW_START,
      }),
    ).toBe("finish");
  });

  it("prefers suspended over running when events share the same timestamp", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "0:send_message": [
            { state: "suspended", t: 10 },
            { state: "start", t: 10 },
          ],
        },
        nodeId: "node-1",
        stepId: "0:send_message",
      }),
    ).toBe("suspended");
  });

  it("prefers cancelled over completed when events share the same timestamp", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "0:send_message": [
            { state: "finish", t: 10 },
            { state: "cancelled", t: 10 },
          ],
        },
        nodeId: "node-1",
        stepId: "0:send_message",
      }),
    ).toBe("cancelled");
  });

  it("keeps the later equal-priority event when events share the same timestamp", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {
          "0:send_message": [
            { state: "start", t: 10 },
            { state: "running", t: 10 },
          ],
        },
        nodeId: "node-1",
        stepId: "0:send_message",
      }),
    ).toBe("running");
  });

  it("returns undefined when no candidate key has execution states", () => {
    expect(
      resolveNodeExecutionState({
        executionStates: {},
        nodeId: "node-1",
        stepId: "0:send_message",
      }),
    ).toBeUndefined();
  });
});
