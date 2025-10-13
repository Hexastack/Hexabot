/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useEffect } from "react";

import { useAppRouter } from "@/hooks/useAppRouter";

import { useVisualEditor } from "./useVisualEditor";

export const useFocusBlock = () => {
  const nodesInitialized = useNodesInitialized();
  const router = useAppRouter();
  const { getNode, fitView } = useReactFlow();
  const { selectNodes, selectedNodeIds, openSearchPanel, setToFocusIds } =
    useVisualEditor();
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

  useEffect(() => {
    const { blockIds } = router.query;

    if (nodesInitialized && typeof blockIds === "string" && blockIds?.length) {
      const nodesIds = blockIds.split(",").filter(getNode);

      selectNodes(nodesIds);
      if (openSearchPanel) {
        animateFocus(nodesIds);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, router.query]);

  return {
    animateFocus,
  };
};
