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
import { useState } from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";

import { VisualEditorContext } from "../contexts/VisualEditorContext";
import { useFocusBlock } from "../hooks/useFocusBlock";
import { VisualEditorContextProps } from "../types/visual-editor.types";

export const VisualEditorProvider3: React.FC<VisualEditorContextProps> = ({
  children,
}) => {
  const ReactFlowInstance = useReactFlow();
  const FocusBlockInstance = useFocusBlock();
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<
    string | undefined
  >();
  const getCentroid = (): XYPosition => {
    if (!window) return { x: 0, y: 0 };
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenCenter = {
      x: screenWidth / 2,
      y: screenHeight / 2,
    };
    const position = ReactFlowInstance.screenToFlowPosition(screenCenter);

    return position;
  };
  const selectNodes = (nodeIds: string[]) => {
    const changes = ReactFlowInstance.getNodes().map((node) => ({
      id: node.id,
      type: "select",
      selected: nodeIds.includes(node.id),
    })) as NodeChange<Node>[];

    ReactFlowInstance.setNodes((nodes) => applyNodeChanges(changes, nodes));
  };

  return (
    <VisualEditorContext.Provider
      value={{
        selectNodes,
        getCentroid,
        selectedNodeIds,
        getBlockFromCache,
        setSelectedNodeIds,
        selectedCategoryId,
        setSelectedCategoryId,
        ...ReactFlowInstance,
        ...FocusBlockInstance,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};
