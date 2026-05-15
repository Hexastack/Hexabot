/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Edge } from "@xyflow/react";

import { DEFAULT_NODE_PROPS } from "../../constants/workflow.constants";
import {
  EEdgeType,
  type GraphNode,
  type INodeConfig,
} from "../../types/workflow-node.types";
import type { FlowStepPath } from "../../types/workflow-path.types";
import {
  getWorkflowNodeCardMetrics,
  getWorkflowNodeCardStyleVariables,
  getWorkflowNodeDimensions,
} from "../node-metrics.utils";

import { GraphRegistry } from "./registry";

export const projectSemanticGraph = (
  registry: GraphRegistry,
  config: INodeConfig,
): { nodes: GraphNode[]; edges: Edge[] } => {
  const nodes: GraphNode[] = registry.listNodes().map((node) => {
    const dimensions = getWorkflowNodeDimensions(node.type, config);
    const style = getWorkflowNodeCardStyleVariables(
      getWorkflowNodeCardMetrics(node.type, config),
    );

    return {
      ...dimensions,
      ...DEFAULT_NODE_PROPS,
      id: node.id,
      type: node.type,
      selectable: Boolean(node.selectable),
      position: { x: 0, y: 0 },
      // Preserve xyflow handle bounds when controlled nodes are replaced for runtime styling.
      measured: dimensions,
      data: node.data as GraphNode["data"],
      style,
    } as GraphNode;
  });
  const edges: Edge[] = registry.listEdges().map((edge) => {
    return {
      id: edge.id,
      type: EEdgeType.EDGE_WITH_BUTTON,
      ...config.edges?.[EEdgeType.EDGE_WITH_BUTTON],
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      hidden: edge.hidden,
      data: edge.insertPath
        ? ({ insertPath: edge.insertPath } as { insertPath?: FlowStepPath })
        : undefined,
    };
  });

  return {
    nodes,
    edges,
  };
};
