/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
