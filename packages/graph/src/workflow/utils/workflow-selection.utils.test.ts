/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import { describe, expect, it } from "vitest";

import { ENodeType, type GraphNode } from "../types/workflow-node.types";

import {
  createWorkflowSelectionSnapshot,
  isSameWorkflowSelection,
} from "./workflow-selection.utils";

const createNode = (
  id: string,
  type: ENodeType,
  data: Record<string, unknown>,
): GraphNode => {
  return {
    id,
    type,
    data,
    position: { x: 0, y: 0 },
  } as unknown as GraphNode;
};

describe("workflow-selection.utils", () => {
  it("extracts task metadata for task nodes", () => {
    const taskNode = createNode("task-node", ENodeType.TASK, {
      title: "send_message",
      actionName: "send_message_action",
    });
    const selection = createWorkflowSelectionSnapshot(
      ["task-node"],
      [taskNode],
    );

    expect(selection.nodeIds).toEqual(["task-node"]);
    expect(selection.nodes).toEqual([
      {
        id: "task-node",
        type: ENodeType.TASK,
        taskName: "send_message",
        actionName: "send_message_action",
        operatorType: undefined,
        stepId: undefined,
        stepPath: undefined,
      },
    ]);
  });

  it("extracts operator metadata", () => {
    const operatorNode = createNode("operator-node", ENodeType.OPERATOR, {
      operatorType: StepType.Parallel,
      stepPath: ["flow", 1],
      stepId: "1:parallel",
    });
    const selection = createWorkflowSelectionSnapshot(
      ["operator-node"],
      [operatorNode],
    );

    expect(selection).toEqual({
      nodeIds: ["operator-node"],
      nodes: [
        {
          id: "operator-node",
          type: ENodeType.OPERATOR,
          operatorType: StepType.Parallel,
          stepId: "1:parallel",
          stepPath: ["flow", 1],
          taskName: undefined,
          actionName: undefined,
        },
      ],
    });
  });

  it("prunes missing selected node IDs", () => {
    const taskNode = createNode("task-node", ENodeType.TASK, {
      title: "task",
    });
    const selection = createWorkflowSelectionSnapshot(
      ["missing-node", "task-node"],
      [taskNode],
    );

    expect(selection.nodeIds).toEqual(["task-node"]);
    expect(selection.nodes).toHaveLength(1);
    expect(selection.nodes[0]?.id).toBe("task-node");
  });

  it("compares selection snapshots deeply for equality guards", () => {
    const baseSelection = {
      nodeIds: ["task-node"],
      nodes: [
        {
          id: "task-node",
          type: ENodeType.TASK,
          taskName: "task",
          actionName: "action",
          stepId: "0:task",
          stepPath: ["flow", 0],
          operatorType: undefined,
        },
      ],
    };
    const sameSelection = {
      nodeIds: ["task-node"],
      nodes: [
        {
          id: "task-node",
          type: ENodeType.TASK,
          taskName: "task",
          actionName: "action",
          stepId: "0:task",
          stepPath: ["flow", 0],
          operatorType: undefined,
        },
      ],
    };
    const changedSelection = {
      nodeIds: ["task-node"],
      nodes: [
        {
          id: "task-node",
          type: ENodeType.TASK,
          taskName: "task_renamed",
          actionName: "action",
          stepId: "0:task",
          stepPath: ["flow", 0],
          operatorType: undefined,
        },
      ],
    };

    expect(isSameWorkflowSelection(baseSelection, sameSelection)).toBe(true);
    expect(isSameWorkflowSelection(baseSelection, changedSelection)).toBe(
      false,
    );
  });
});
