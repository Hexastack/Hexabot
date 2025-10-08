/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useDialogs } from "@/hooks/useDialogs";

import { BlockEditFormDialog } from "../../components/block/BlockEditFormDialog";

import { useVisualEditor } from "./useVisualEditor";

export const useEditBlockDialog = () => {
  const dialogs = useDialogs();
  const { selectedNodeIds, getBlockFromCache } = useVisualEditor();
  const openEditDialog = (selectedBlockId: string = selectedNodeIds[0]) => {
    const defaultValues = getBlockFromCache(selectedBlockId);

    dialogs.open(
      BlockEditFormDialog,
      { defaultValues },
      {
        maxWidth: "md",
        isSingleton: true,
      },
    );
  };

  return {
    openEditDialog,
  };
};
