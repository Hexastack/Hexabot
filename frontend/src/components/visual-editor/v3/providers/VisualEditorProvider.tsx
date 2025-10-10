/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  applyNodeChanges,
  Node,
  NodeChange,
  useReactFlow,
  XYPosition,
} from "@xyflow/react";
import { useRouter } from "next/router";
import { useState } from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdateCache } from "@/hooks/crud/useUpdate";
import { EntityType, RouterType } from "@/services/types";

import { VisualEditorContext } from "../contexts/VisualEditorContext";
import { VisualEditorContextProps } from "../types/visual-editor.types";

export const VisualEditorProvider: React.FC<VisualEditorContextProps> = ({
  children,
}) => {
  const router = useRouter();
  const { screenToFlowPosition, getNodes, setNodes } = useReactFlow();
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const updateCachedBlock = useUpdateCache(EntityType.BLOCK);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [openSearchPanel, setOpenSearchPanel] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const [toFocusIds, setToFocusIds] = useState<string[]>([]);
  const getCentroid = (): XYPosition => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenCenter = {
      x: screenWidth / 2,
      y: screenHeight / 2,
    };

    return screenToFlowPosition(screenCenter);
  };
  const selectNodes = (nodeIds: string[]): void => {
    setSelectedNodeIds(nodeIds);
    const changes = getNodes().map(({ id }) => ({
      id,
      type: "select",
      selected: nodeIds.includes(id),
    })) as NodeChange<Node>[];

    setNodes((nodes) => applyNodeChanges(changes, nodes));
  };
  const updateCachePreviousBlocks = (
    operation: "add" | "del",
    source: string,
    target: string,
  ) => {
    updateCachedBlock({
      id: target,
      strategy: "merge",
      preprocess: ({ previousBlocks = [], ...rest }) => ({
        ...rest,
        previousBlocks:
          operation === "add"
            ? [...previousBlocks, source]
            : previousBlocks?.filter((p) => p !== source),
      }),
    });
  };
  const getQuery = (key: string): string =>
    typeof router.query[key] === "string" ? router.query[key] : "";
  const updateVisualEditorURL = async (
    category: string,
    blockIds: string[] = [],
  ) => {
    const blockParam = Array.isArray(blockIds) && blockIds.length ? `/${blockIds.join(",")}` : "";

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

  return (
    <VisualEditorContext.Provider
      value={{
        getQuery,
        toFocusIds,
        selectNodes,
        getCentroid,
        setToFocusIds,
        openSearchPanel,
        selectedNodeIds,
        getBlockFromCache,
        setOpenSearchPanel,
        setSelectedNodeIds,
        removeBlockIdParam,
        selectedCategoryId,
        updateVisualEditorURL,
        setSelectedCategoryId,
        updateCachePreviousBlocks,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};
