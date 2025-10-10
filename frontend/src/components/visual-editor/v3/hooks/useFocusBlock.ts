/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { RouterType } from "@/services/types";

import { useVisualEditor } from "./useVisualEditor";

export const useFocusBlock = () => {
  const nodesInitialized = useNodesInitialized();
  const router = useRouter();
  const { getNode, fitView } = useReactFlow();
  const { selectNodes, selectedCategoryId, selectedNodeIds, openSearchPanel } =
    useVisualEditor();
  const animateFocus = async (blockId?: string) => {
    if (blockId) {
      const node = getNode(blockId);

      if (node) {
        await fitView({
          nodes: [node],
          padding: "150px",
          duration: 200,
        });
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
      }
    }
  };
  const getQuery = (key: string): string =>
    typeof router.query[key] === "string" ? router.query[key] : "";

  useEffect(() => {
    const { blockIds } = router.query;

    if (nodesInitialized) {
      if (typeof blockIds === "string" && blockIds?.length) {
        selectNodes(blockIds.split(",").filter(getNode));
        if (openSearchPanel) {
          animateFocus(blockIds);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, router.query]);

  const updateVisualEditorURL = async (
    category: string,
    blockIds: string[] = [],
  ) => {
    const blockParam = blockIds.join ? `/${blockIds.join(",")}` : "";

    if (router.pathname.startsWith(`/${RouterType.VISUAL_EDITOR}`)) {
      await router.push(
        `/${RouterType.VISUAL_EDITOR}/flows/${category}${blockParam}`,
      );
    }
  };
  const removeBlockIdParam = async () => {
    if (selectedCategoryId) {
      await router.replace(
        `/${RouterType.VISUAL_EDITOR}/flows/${selectedCategoryId}`,
      );
    }
  };

  return {
    updateVisualEditorURL,
    removeBlockIdParam,
    getQuery,
    animateFocus,
  };
};
