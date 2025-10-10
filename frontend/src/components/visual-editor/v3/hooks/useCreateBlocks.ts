/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useCreate } from "@/hooks/crud/useCreate";
import { EntityType } from "@/services/types";
import { IBlockAttributes } from "@/types/block.types";

import { useVisualEditor } from "./useVisualEditor";

export const useCreateBlock = () => {
  const { getCentroid, getBlockFromCache, updateVisualEditorURL } =
    useVisualEditor();
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

      createBlock(
        {
          ...duplicateBlockDto,
          ...props,
          name: `${block.name} (Copy)`,
          position: {
            x: position.x + 100,
            y: position.y + 100,
          },
        },
        {
          onSuccess: async (data, { category }) => {
            await updateVisualEditorURL(category, [data.id]);
          },
        },
      );
    } else if (props) {
      createBlock(
        { ...props, position: props.position || getCentroid() },
        {
          onSuccess: async (data, { category }) => {
            await updateVisualEditorURL(category, [data.id]);
          },
        },
      );
    }
  };

  return {
    createNode,
    createNodes: (ids: string[]) => {
      ids.map((id) => createNode(id));
    },
  };
};
