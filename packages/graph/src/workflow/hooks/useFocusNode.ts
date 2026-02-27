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
} from '@xyflow/react';
import type { Padding } from '@xyflow/system';
import { useCallback, useEffect, useMemo } from "react";

import { GraphNode } from '../types/workflow-node.types';

type UseFocusNodeProps = {
  queryNodeIds?: string;
  selectedNodeIds: string[];
  onQueryNodeIdsResolved?: (nodeIds: string[]) => void;
  onFocused?: () => void;
  fitViewPadding?: Padding;
  fitViewDuration?: number;
};

export const useFocusNode = ({
  queryNodeIds,
  selectedNodeIds,
  onQueryNodeIdsResolved,
  onFocused,
  fitViewPadding = '150px',
  fitViewDuration = 200,
}: UseFocusNodeProps) => {
  const { getNode, getNodes, fitView, setNodes } = useReactFlow<GraphNode>();
  const onSelectNodes = useCallback(
    (nodeIds: string[]): void => {
      const changes = getNodes().map(({ id }) => ({
        id,
        type: 'select',
        selected: nodeIds.includes(id),
      })) as NodeChange<GraphNode>[];

      setNodes((nodes) => applyNodeChanges<GraphNode>(changes, nodes));
    },
    [getNodes, setNodes],
  );
  const nodesInitialized = useNodesInitialized();
  const queryRequestedNodeIds = useMemo(
    () => queryNodeIds?.split(',').filter(Boolean) ?? [],
    [queryNodeIds],
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
  const queryResolvedNodeIds = useMemo(
    () =>
      !queryRequestedNodeIds.length || !nodesInitialized
        ? []
        : queryRequestedNodeIds.filter((nodeId) => Boolean(getNode(nodeId))),
    [getNode, nodesInitialized, queryRequestedNodeIds],
  );

  useEffect(() => {
    if (!nodesInitialized) {
      return;
    }

    if (!queryRequestedNodeIds.length) {
      onSelectNodes([]);

      return;
    }
    onSelectNodes(queryResolvedNodeIds);
    onQueryNodeIdsResolved?.(queryResolvedNodeIds);
  }, [
    nodesInitialized,
    onQueryNodeIdsResolved,
    onSelectNodes,
    queryResolvedNodeIds,
    queryRequestedNodeIds.length,
  ]);

  return {
    animateFocus,
  };
};
