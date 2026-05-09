/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { WORKFLOW_LARGE_GRAPH_ELEMENT_THRESHOLD } from "../constants/workflow.constants";

import {
  isLargeWorkflowGraph,
  shouldShowWorkflowEdgeInsertControls,
} from "./workflow-rendering.utils";

describe("workflow-rendering.utils", () => {
  it("detects large graphs from combined node and edge counts", () => {
    expect(
      isLargeWorkflowGraph({
        nodeCount: WORKFLOW_LARGE_GRAPH_ELEMENT_THRESHOLD - 1,
        edgeCount: 0,
      }),
    ).toBe(false);
    expect(
      isLargeWorkflowGraph({
        nodeCount: WORKFLOW_LARGE_GRAPH_ELEMENT_THRESHOLD - 1,
        edgeCount: 1,
      }),
    ).toBe(true);
  });

  it("keeps edge insert controls visible for small graphs", () => {
    expect(
      shouldShowWorkflowEdgeInsertControls({
        isLargeGraph: false,
        isMoving: true,
        zoom: 0.1,
      }),
    ).toBe(true);
  });

  it("hides edge insert controls for large graphs while moving or zoomed out", () => {
    expect(
      shouldShowWorkflowEdgeInsertControls({
        isLargeGraph: true,
        isMoving: true,
        zoom: 1,
      }),
    ).toBe(false);
    expect(
      shouldShowWorkflowEdgeInsertControls({
        isLargeGraph: true,
        isMoving: false,
        zoom: 0.5,
      }),
    ).toBe(false);
    expect(
      shouldShowWorkflowEdgeInsertControls({
        isLargeGraph: true,
        isMoving: false,
        zoom: 0.55,
      }),
    ).toBe(true);
  });
});
