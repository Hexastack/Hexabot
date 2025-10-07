/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
