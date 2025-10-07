/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useNodesInitialized } from "@xyflow/react";
import { useEffect } from "react";
import { useQueryClient } from "react-query";

import { isSameEntity } from "@/hooks/crud/helpers";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdateMany } from "@/hooks/crud/useUpdateMany";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";

import { BlockMoveFormDialog } from "../../components/block/BlockMoveFormDialog";

import { useFocusBlock } from "./useFocusBlock";
import { useVisualEditor } from "./useVisualEditor";

export const useMoveBlocksDialog = () => {
  const dialogs = useDialogs();
  const { toast } = useToast();
  const { t } = useTranslate();
  const nodesInitialized = useNodesInitialized();
  const {
    selectedNodeIds,
    selectedCategoryId,
    selectNodes,
    setToFocusIds,
    toFocusIds,
  } = useVisualEditor();
  const { updateVisualEditorURL, animateFocus } = useFocusBlock();
  const queryClient = useQueryClient();
  const { mutate: updateBlocks } = useUpdateMany(EntityType.BLOCK);
  const { data: categories } = useFind(
    { entity: EntityType.CATEGORY },
    {
      hasCount: false,
      initialSortState: [{ field: "createdAt", sort: "asc" }],
    },
  );
  const onCategoryChange = async (
    targetCategory: number,
    blockIds: string[] = [],
  ) => {
    if (categories) {
      const { id } = categories[targetCategory];

      if (id) {
        await updateVisualEditorURL(id, blockIds);
        setToFocusIds(blockIds);
      }
    }
  };
  const onMove = (ids: string[], targetCategoryId: string) => {
    if (ids.length) {
      updateBlocks(
        { ids, payload: { category: targetCategoryId } },
        {
          onSuccess() {
            queryClient.invalidateQueries({
              predicate: ({ queryKey }) => {
                const [qType, qEntity] = queryKey;

                return (
                  qType === QueryType.collection &&
                  isSameEntity(qEntity, EntityType.BLOCK)
                );
              },
            });

            const targetCategoryIndex = categories.findIndex(
              ({ id }) => id === targetCategoryId,
            );

            if (targetCategoryIndex !== -1) {
              onCategoryChange(targetCategoryIndex, ids);
            }
          },
          onError: () => {
            toast.error(t("message.move_block_error"));
          },
        },
      );
    }
  };
  const openMoveDialog = (
    ids: string[] = selectedNodeIds,
    category: string | undefined = selectedCategoryId,
  ) => {
    if (ids.length && category) {
      dialogs.open(BlockMoveFormDialog, {
        defaultValues: {
          ids,
          onMove,
          category,
          categories,
        },
      });
    }
  };

  useEffect(() => {
    if (nodesInitialized && toFocusIds.length) {
      selectNodes(toFocusIds);
      setToFocusIds([]);
      animateFocus();
    }
  }, [nodesInitialized, categories]);

  return {
    openMoveDialog,
    onCategoryChange,
  };
};
