/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useReactFlow, XYPosition } from "@xyflow/react";
import * as React from "react";
import { createContext, useContext, useState } from "react";

import { useCreate } from "@/hooks/crud/useCreate";
import { useGetFromCache } from "@/hooks/crud/useGet";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";

import {
  IVisualEditorContext,
  VisualEditorContextProps,
} from "../types/visual-editor.types";

const VisualEditorContext = createContext<IVisualEditorContext>({
  selectedCategoryId: undefined,
  setSelectedCategoryId: () => {},
} as any);
const VisualEditorProvider: React.FC<VisualEditorContextProps> = ({
  children,
}) => {
  const ReactFlowInstance = useReactFlow();
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
  const getBlockFromCache = useGetFromCache(EntityType.BLOCK);
  const { mutate: createBlock } = useCreate(EntityType.BLOCK);
  const createNode = (id: string | undefined, props?: IBlockAttributes) => {
    if (id) {
      const block = getBlockFromCache(id);

      if (!block) {
        return;
      }
      const {
        attachedBlock: _attachedBlock,
        nextBlocks: _nextBlocks,
        previousBlocks: _previousBlocks,
        id: _id,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        position,
        ...duplicateBlockDto
      } = block;

      createBlock({
        ...duplicateBlockDto,
        ...props,
        name: `${block.name} (Copy)`,
        position: {
          x: position.x + 100,
          y: position.y + 100,
        },
      });
    } else if (props) {
      const { position = getCentroid(), ...rest } = props;

      createBlock({ position, ...rest });
    }
  };

  return (
    <VisualEditorContext.Provider
      value={{
        setSelectedCategoryId,
        selectedCategoryId,
        createNode,
        getCentroid,
        selectedNodeIds,
        setSelectedNodeIds,
      }}
    >
      {children}
    </VisualEditorContext.Provider>
  );
};

export default VisualEditorProvider;

export const useVisualEditorV3 = (): IVisualEditorContext => {
  const context = useContext(VisualEditorContext);

  if (!context) {
    throw new Error(
      "useVisualEditor must be used within an VisualEditorContext",
    );
  }

  return context;
};
