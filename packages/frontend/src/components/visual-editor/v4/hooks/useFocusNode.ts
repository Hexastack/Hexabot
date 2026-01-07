/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useEffect, useMemo } from "react";

import { useAppRouter } from "@/hooks/useAppRouter";

import { useWorkflow } from "./useWorkflow";

export const useFocusNode = () => {
  const { getNode, fitView } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const { query } = useAppRouter();
  const { nodeIds } = query;
  const { selectNodes, selectedNodeIds, setToFocusIds } = useWorkflow();
  const animateFocus = async (blockIds: string[] = []) => {
    selectNodes(blockIds);
    if (blockIds.length === 1) {
      const node = getNode(blockIds[0]);

      if (node) {
        await fitView({
          nodes: [node],
          padding: "150px",
          duration: 200,
        });
        setToFocusIds([]);
      }
    } else {
      const nodes = selectedNodeIds
        .map((s) => getNode(s))
        .filter((n): n is Node => !!n);

      if (nodes.length) {
        await fitView({
          nodes,
          padding: "150px",
          duration: 200,
        });
        setToFocusIds([]);
      }
    }
  };
  const blockIdsParams = useMemo(
    () =>
      !nodeIds?.length || !nodesInitialized || typeof nodeIds !== "string"
        ? []
        : nodeIds.toString().split(",").filter(getNode),
    [nodesInitialized, nodeIds],
  );

  useEffect(() => {
    selectNodes(blockIdsParams);
  }, [blockIdsParams]);

  return {
    animateFocus,
  };
};
