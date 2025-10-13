/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ConfirmDialogBody } from "@/app-components/dialogs";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { useDialogs } from "@/hooks/useDialogs";
import { useToast } from "@/hooks/useToast";
import { EntityType } from "@/services/types";

import { useVisualEditor } from "./useVisualEditor";

export const useDeleteManyBlocksDialog = () => {
  const dialogs = useDialogs();
  const { toast } = useToast();
  const { selectedNodeIds, removeBlockIdParam } = useVisualEditor();
  const { mutate: deleteBlocks } = useDeleteMany(EntityType.BLOCK);
  const openDeleteManyDialog = async (ids: string[] = selectedNodeIds) => {
    if (ids.length) {
      const isConfirmed = await dialogs.confirm(ConfirmDialogBody, {
        mode: "selection",
        count: ids.length,
        isSingleton: true,
      });

      if (isConfirmed) {
        deleteBlocks(ids, {
          onSuccess: () => {
            removeBlockIdParam();
          },
          onError: (error) => {
            toast.error(error.message);
          },
        });
      }
    }
  };

  return {
    openDeleteManyDialog,
  };
};
