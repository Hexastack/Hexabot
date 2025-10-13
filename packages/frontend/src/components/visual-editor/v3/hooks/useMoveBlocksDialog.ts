/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useQueryClient } from "react-query";

import { isSameEntity } from "@/hooks/crud/helpers";
import { useUpdateMany } from "@/hooks/crud/useUpdateMany";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";

import { BlockMoveFormDialog } from "../../components/block/BlockMoveFormDialog";

import { useCategories } from "./useCategories";
import { useVisualEditor } from "./useVisualEditor";

export const useMoveBlocksDialog = () => {
  const dialogs = useDialogs();
  const { toast } = useToast();
  const { t } = useTranslate();
  const {
    setToFocusIds,
    selectedNodeIds,
    selectedCategoryId,
    updateVisualEditorURL,
  } = useVisualEditor();
  const queryClient = useQueryClient();
  const { mutate: updateBlocks } = useUpdateMany(EntityType.BLOCK);
  const { categories, getCategory, getCategoryIndex } = useCategories();
  const onCategoryChange = async (
    categoryIndex: number,
    blockIds: string[] = [],
  ) => {
    const category = getCategory(categoryIndex);

    if (category?.id) {
      await updateVisualEditorURL(category.id, blockIds);
      setToFocusIds(blockIds);
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

            const categoryIndex = getCategoryIndex(targetCategoryId);

            if (categoryIndex !== -1) {
              onCategoryChange(categoryIndex, ids);
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

  return {
    openMoveDialog,
    onCategoryChange,
  };
};
