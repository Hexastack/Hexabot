/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { ENodeType, type GraphNode } from "../types/workflow-node.types";

import { applyWorkflowExecutionStatesToNodes } from "./workflow-runtime-node.utils";

const createNode = (id: string, stepId: string): GraphNode =>
  ({
    id,
    type: ENodeType.TASK,
    position: { x: 0, y: 0 },
    data: {
      title: id,
      stepId,
      ports: [],
      theme: {},
    },
  }) as GraphNode;

describe("workflow-runtime-node.utils", () => {
  it("preserves the source array when no execution state changes are needed", () => {
    const nodes = [createNode("node-1", "step-1")];
    const runtimeNodes = applyWorkflowExecutionStatesToNodes(nodes, {});

    expect(runtimeNodes).toBe(nodes);
    expect(runtimeNodes[0]).toBe(nodes[0]);
  });

  it("preserves unchanged node identity when another node receives execution state", () => {
    const firstNode = createNode("node-1", "step-1");
    const secondNode = createNode("node-2", "step-2");
    const runtimeNodes = applyWorkflowExecutionStatesToNodes(
      [firstNode, secondNode],
      {
        "step-2": [{ state: "running", t: 1 }],
      },
    );

    expect(runtimeNodes[0]).toBe(firstNode);
    expect(runtimeNodes[1]).not.toBe(secondNode);
    expect(
      (runtimeNodes[1]?.data as { executionState?: unknown }).executionState,
    ).toBe("running");
  });
});
