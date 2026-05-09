/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StepType } from "@hexabot-ai/agentic";

import {
  ENodeType,
  type EOperatorType,
  type GraphNode,
} from "../types/workflow-node.types";
import type { FlowStepPath } from "../types/workflow-path.types";
import type {
  WorkflowSelectionNode,
  WorkflowSelectionSnapshot,
} from "../types/workflow-selection.types";

const isOperatorType = (value: unknown): value is EOperatorType => {
  return (
    value === StepType.Conditional ||
    value === StepType.Loop ||
    value === StepType.Parallel
  );
};
const toStepPath = (value: unknown): FlowStepPath | undefined => {
  return Array.isArray(value) ? (value as FlowStepPath) : undefined;
};
const toStringValue = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

export const createWorkflowSelectionNode = (
  node: GraphNode,
): WorkflowSelectionNode => {
  const nodeData = node.data as {
    stepId?: unknown;
    stepPath?: unknown;
    operatorType?: unknown;
    title?: unknown;
    actionName?: unknown;
  };

  return {
    id: node.id,
    type: node.type,
    stepId: toStringValue(nodeData.stepId),
    stepPath: toStepPath(nodeData.stepPath),
    operatorType: isOperatorType(nodeData.operatorType)
      ? nodeData.operatorType
      : undefined,
    taskName:
      node.type === ENodeType.TASK ? toStringValue(nodeData.title) : undefined,
    actionName:
      node.type === ENodeType.TASK
        ? toStringValue(nodeData.actionName)
        : undefined,
  };
};

export const createWorkflowSelectionSnapshot = (
  requestedNodeIds: string[],
  nodes: GraphNode[],
): WorkflowSelectionSnapshot => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return createWorkflowSelectionSnapshotFromMap(requestedNodeIds, nodesById);
};

export const createWorkflowSelectionSnapshotFromMap = (
  requestedNodeIds: string[],
  nodesById: ReadonlyMap<string, GraphNode>,
): WorkflowSelectionSnapshot => {
  const nodeIds: string[] = [];
  const selectionNodes: WorkflowSelectionNode[] = [];

  requestedNodeIds.forEach((nodeId) => {
    const node = nodesById.get(nodeId);

    if (!node) {
      return;
    }

    nodeIds.push(nodeId);
    selectionNodes.push(createWorkflowSelectionNode(node));
  });

  return {
    nodeIds,
    nodes: selectionNodes,
  };
};

const isSameStepPath = (
  leftStepPath: FlowStepPath | undefined,
  rightStepPath: FlowStepPath | undefined,
): boolean => {
  if (!leftStepPath || !rightStepPath) {
    return leftStepPath === rightStepPath;
  }

  if (leftStepPath.length !== rightStepPath.length) {
    return false;
  }

  return leftStepPath.every(
    (pathPart, index) => pathPart === rightStepPath[index],
  );
};

export const isSameWorkflowSelectionNode = (
  leftNode: WorkflowSelectionNode,
  rightNode: WorkflowSelectionNode,
): boolean => {
  return (
    leftNode.id === rightNode.id &&
    leftNode.type === rightNode.type &&
    leftNode.stepId === rightNode.stepId &&
    leftNode.operatorType === rightNode.operatorType &&
    leftNode.taskName === rightNode.taskName &&
    leftNode.actionName === rightNode.actionName &&
    isSameStepPath(leftNode.stepPath, rightNode.stepPath)
  );
};

export const isSameWorkflowSelection = (
  leftSelection: WorkflowSelectionSnapshot,
  rightSelection: WorkflowSelectionSnapshot,
): boolean => {
  if (
    leftSelection.nodeIds.length !== rightSelection.nodeIds.length ||
    leftSelection.nodes.length !== rightSelection.nodes.length
  ) {
    return false;
  }

  for (let index = 0; index < leftSelection.nodeIds.length; index += 1) {
    if (leftSelection.nodeIds[index] !== rightSelection.nodeIds[index]) {
      return false;
    }
  }

  for (let index = 0; index < leftSelection.nodes.length; index += 1) {
    if (
      !isSameWorkflowSelectionNode(
        leftSelection.nodes[index],
        rightSelection.nodes[index],
      )
    ) {
      return false;
    }
  }

  return true;
};
