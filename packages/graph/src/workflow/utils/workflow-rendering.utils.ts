/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WORKFLOW_LARGE_GRAPH_ELEMENT_THRESHOLD,
  WORKFLOW_LARGE_GRAPH_MIN_INSERT_ZOOM,
} from "../constants/workflow.constants";

export const isLargeWorkflowGraph = ({
  edgeCount,
  nodeCount,
}: {
  edgeCount: number;
  nodeCount: number;
}): boolean => nodeCount + edgeCount >= WORKFLOW_LARGE_GRAPH_ELEMENT_THRESHOLD;

export const shouldShowWorkflowEdgeInsertControls = ({
  isLargeGraph,
  isMoving,
  zoom,
}: {
  isLargeGraph: boolean;
  isMoving: boolean;
  zoom: number;
}): boolean =>
  !isLargeGraph || (!isMoving && zoom >= WORKFLOW_LARGE_GRAPH_MIN_INSERT_ZOOM);
