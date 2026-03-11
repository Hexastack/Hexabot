/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";
import {
  ENodeType,
  type WorkflowSelectionSnapshot,
} from "@hexabot-ai/graph";
import { describe, expect, it } from "vitest";

import {
  getSelectedActionNode,
  getSelectedOperatorNode,
  getSingleSelectedNode,
} from "./useWorkflowSelection";

describe("useWorkflowSelection selectors", () => {
  it("returns undefined for single-node selector on multi selection", () => {
    const selection: WorkflowSelectionSnapshot = {
      nodeIds: ["task-1", "task-2"],
      nodes: [
        {
          id: "task-1",
          type: ENodeType.TASK,
        },
        {
          id: "task-2",
          type: ENodeType.TASK,
        },
      ],
    };

    expect(getSingleSelectedNode(selection)).toBeUndefined();
  });

  it("returns selected action node for task nodes", () => {
    const taskSelection: WorkflowSelectionSnapshot = {
      nodeIds: ["task-1"],
      nodes: [
        {
          id: "task-1",
          type: ENodeType.TASK,
          taskName: "send_message",
          actionName: "send_message_action",
        },
      ],
    };

    expect(getSelectedActionNode(taskSelection)?.id).toBe("task-1");
  });

  it("returns undefined for action selector when taskName is missing", () => {
    const selection: WorkflowSelectionSnapshot = {
      nodeIds: ["task-1"],
      nodes: [
        {
          id: "task-1",
          type: ENodeType.TASK,
        },
      ],
    };

    expect(getSelectedActionNode(selection)).toBeUndefined();
  });

  it("returns operator selector only for matching operator type and step path", () => {
    const selection: WorkflowSelectionSnapshot = {
      nodeIds: ["operator-1"],
      nodes: [
        {
          id: "operator-1",
          type: ENodeType.OPERATOR,
          operatorType: StepType.Parallel,
          stepPath: ["flow", 0],
        },
      ],
    };

    expect(getSelectedOperatorNode(selection, StepType.Parallel)?.id).toBe(
      "operator-1",
    );
    expect(getSelectedOperatorNode(selection, StepType.Loop)).toBeUndefined();
  });
});
