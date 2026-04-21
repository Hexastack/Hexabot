/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  applyNodeChanges,
  type NodeChange,
  useNodesInitialized,
  useReactFlow,
} from "@xyflow/react";
import type { Padding } from "@xyflow/system";
import { useCallback, useEffect, useMemo } from "react";

import { GraphNode } from "../types/workflow-node.types";

type UseFocusNodeProps = {
  focusNodeIds?: string[];
  selectedNodeIds: string[];
  onFocusNodeIdsResolved?: (nodeIds: string[]) => void;
  onFocused?: () => void;
  fitViewPadding?: Padding;
  fitViewDuration?: number;
};

export const useFocusNode = ({
  focusNodeIds,
  selectedNodeIds,
  onFocusNodeIdsResolved,
  onFocused,
  fitViewPadding = "150px",
  fitViewDuration = 200,
}: UseFocusNodeProps) => {
  const { getNode, getNodes, fitView, setNodes } = useReactFlow<GraphNode>();
  const onSelectNodes = useCallback(
    (nodeIds: string[]): void => {
      const changes = getNodes().map(({ id }) => ({
        id,
        type: "select",
        selected: nodeIds.includes(id),
      })) as NodeChange<GraphNode>[];

      setNodes((nodes) => applyNodeChanges<GraphNode>(changes, nodes));
    },
    [getNodes, setNodes],
  );
  const nodesInitialized = useNodesInitialized();
  const requestedFocusNodeIds = useMemo(
    () => focusNodeIds?.filter(Boolean) ?? [],
    [focusNodeIds],
  );
  const resolveExistingNodes = useCallback(
    (nodeIds: string[]): GraphNode[] =>
      nodeIds
        .map((selectedNodeId) => getNode(selectedNodeId))
        .filter((node): node is GraphNode => Boolean(node)),
    [getNode],
  );
  const animateFocus = async (nodeIds?: string[]) => {
    const nodes = resolveExistingNodes(nodeIds ?? selectedNodeIds);

    if (nodeIds !== undefined) {
      onSelectNodes(nodes.map(({ id }) => id));
    }

    if (!nodes.length) {
      return;
    }

    await fitView({
      nodes,
      padding: fitViewPadding,
      duration: fitViewDuration,
    });
    onFocused?.();
  };
  const resolvedFocusNodeIds = useMemo(
    () =>
      !requestedFocusNodeIds.length || !nodesInitialized
        ? []
        : requestedFocusNodeIds.filter((nodeId) => Boolean(getNode(nodeId))),
    [getNode, nodesInitialized, requestedFocusNodeIds],
  );

  useEffect(() => {
    if (!nodesInitialized) {
      return;
    }

    if (!requestedFocusNodeIds.length) {
      onSelectNodes([]);

      return;
    }
    onSelectNodes(resolvedFocusNodeIds);
    onFocusNodeIdsResolved?.(resolvedFocusNodeIds);
  }, [
    nodesInitialized,
    onFocusNodeIdsResolved,
    onSelectNodes,
    requestedFocusNodeIds.length,
    resolvedFocusNodeIds,
  ]);

  return {
    animateFocus,
  };
};
