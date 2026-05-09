/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  EIndicatorType,
  GraphNode,
  NodeExecutionState,
  WorkflowExecutionStateMap,
} from "../types/workflow-node.types";

import { resolveNodeExecutionState } from "./execution-state.utils";

const resolveRuntimeNodeExecutionState = (
  node: GraphNode,
  executionStates: WorkflowExecutionStateMap,
): NodeExecutionState | undefined => {
  const nodeData = node.data as {
    stepId?: unknown;
    indicator?: unknown;
  };
  const stepId =
    typeof nodeData.stepId === "string" ? nodeData.stepId : undefined;
  const indicator =
    typeof nodeData.indicator === "string"
      ? (nodeData.indicator as EIndicatorType)
      : undefined;

  return resolveNodeExecutionState({
    executionStates,
    nodeId: node.id,
    stepId,
    indicator,
  });
};

export const applyWorkflowExecutionStatesToNodes = (
  nodes: GraphNode[],
  executionStates: WorkflowExecutionStateMap,
): GraphNode[] => {
  if (nodes.length === 0) {
    return nodes;
  }

  let didChange = false;
  const runtimeNodes = nodes.map((node) => {
    const executionState = resolveRuntimeNodeExecutionState(
      node,
      executionStates,
    );
    const currentExecutionState = (
      node.data as { executionState?: NodeExecutionState }
    ).executionState;

    if (currentExecutionState === executionState) {
      return node;
    }

    didChange = true;

    return {
      ...node,
      data: {
        ...node.data,
        executionState,
      } as GraphNode["data"],
    } as GraphNode;
  });

  return didChange ? runtimeNodes : nodes;
};
