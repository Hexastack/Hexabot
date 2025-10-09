/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useEffect } from "react";

import { useAppRouter } from "@/hooks/useAppRouter";
import { RouterType } from "@/services/types";

import { useVisualEditor } from "./useVisualEditor";

export const useFocusBlock = () => {
  const nodesInitialized = useNodesInitialized();
  const router = useAppRouter();
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
  const getQuery = (key: string): string => {
    const value = router.query[key];

    return Array.isArray(value) ? value.at(-1) || "" : value || "";
  };

  useEffect(() => {
    const blockIdsParam = router.query.blockIds;
    const blockIds =
      typeof blockIdsParam === "string"
        ? blockIdsParam
        : Array.isArray(blockIdsParam)
          ? blockIdsParam.at(-1)
          : undefined;

    if (nodesInitialized) {
      if (blockIds?.length) {
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
