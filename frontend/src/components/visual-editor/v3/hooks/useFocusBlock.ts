/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Node, useNodesInitialized, useReactFlow } from "@xyflow/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { RouterType } from "@/services/types";

import { useVisualEditor } from "./useVisualEditor";

export const useFocusBlock = () => {
  const nodesInitialized = useNodesInitialized();
  const router = useRouter();
  const { getNode, fitView } = useReactFlow();
  const { selectNodes, selectedCategoryId, selectedNodeIds } =
    useVisualEditor();
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
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
    const { blockId } = router.query;

    if (nodesInitialized && typeof blockId === "string" && blockId) {
      selectNodes([blockId]);
      if (openSearchPanel) {
        animateFocus(blockId);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, router.query]);

  const updateVisualEditorURL = async (category: string, blockId?: string) => {
    const blockParam = blockId ? `/${blockId}` : "";

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
    openSearchPanel,
    setOpenSearchPanel,
    animateFocus,
  };
};
