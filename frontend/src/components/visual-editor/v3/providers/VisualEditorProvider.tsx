/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  applyNodeChanges,
  Node,
  NodeChange,
  useReactFlow,
  XYPosition,
} from "@xyflow/react";
import { useState } from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { useUpdateCache } from "@/hooks/crud/useUpdate";
import { EntityType } from "@/services/types";

import { VisualEditorContext } from "../contexts/VisualEditorContext";
import { VisualEditorContextProps } from "../types/visual-editor.types";

export const VisualEditorProvider: React.FC<VisualEditorContextProps> = ({
  children,
}) => {
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

  return (
    <VisualEditorContext.Provider
      value={{
        toFocusIds,
        selectNodes,
        getCentroid,
        setToFocusIds,
        openSearchPanel,
        selectedNodeIds,
        getBlockFromCache,
        setOpenSearchPanel,
        setSelectedNodeIds,
        selectedCategoryId,
        setSelectedCategoryId,
        updateCachePreviousBlocks,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};
