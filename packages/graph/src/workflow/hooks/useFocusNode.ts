/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  applyNodeChanges,
  type Node,
  type NodeChange,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react';
import type { Padding } from '@xyflow/system';
import { useEffect, useMemo } from "react";

import { GraphNode } from '../types/workflow-node.types';

type UseFocusNodeProps = {
  queryNodeIds?: string;
  selectedNodeIds: string[];
  onFocused?: () => void;
  fitViewPadding?: Padding;
  fitViewDuration?: number;
};

export const useFocusNode = ({
  queryNodeIds,
  selectedNodeIds,
  onFocused,
  fitViewPadding = '150px',
  fitViewDuration = 200,
}: UseFocusNodeProps) => {
  const { getNodes, setNodes } = useReactFlow<GraphNode>();
  const onSelectNodes = (nodeIds: string[]): void => {
    const changes = getNodes().map(({ id }) => ({
      id,
      type: 'select',
      selected: nodeIds.includes(id),
    })) as NodeChange<GraphNode>[];

    setNodes((nodes) => applyNodeChanges<GraphNode>(changes, nodes));
  };
  const { getNode, fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const animateFocus = async (nodeIds: string[] = []) => {
    onSelectNodes(nodeIds);

    if (nodeIds.length === 1) {
      const node = getNode(nodeIds[0]);

      if (node) {
        await fitView({
          nodes: [node],
          padding: fitViewPadding,
          duration: fitViewDuration,
        });
        onFocused?.();
      }

      return;
    }

    const nodes = selectedNodeIds
      .map((selectedNodeId) => getNode(selectedNodeId))
      .filter((node): node is Node => Boolean(node));

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
  const queryNodeIdsParams = useMemo(
    () =>
      !queryNodeIds?.length || !nodesInitialized
        ? []
        : queryNodeIds.split(',').filter((nodeId) => Boolean(getNode(nodeId))),
    [getNode, nodesInitialized, queryNodeIds],
  );

  useEffect(() => {
    onSelectNodes(queryNodeIdsParams);
  }, [onSelectNodes, queryNodeIdsParams]);

  return {
    animateFocus,
  };
};
