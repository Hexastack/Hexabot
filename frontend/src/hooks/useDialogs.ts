/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import React, { useContext, useMemo } from "react";

import { ConfirmDialog } from "@/app-components/dialogs";
import { DialogsContext } from "@/contexts/dialogs.context";
import {
  CloseDialog,
  OpenConfirmDialog,
  OpenDialog,
} from "@/types/common/dialogs.types";

export interface DialogHook {
  open: OpenDialog;
  close: CloseDialog;
  // alert: OpenAlertDialog;
  // prompt: OpenPromptDialog;
  confirm: OpenConfirmDialog;
}

export const useDialogs = (): DialogHook => {
  const context = useContext(DialogsContext);

  if (!context) {
    throw new Error("useDialogs must be used within a DialogsProvider");
  }

  const { open, close } = context;
  // const alert = React.useCallback<OpenAlertDialog>(
  //   async (msg, { onClose, ...options } = {}) =>
  //     open(AlertDialog, { ...options, msg }, { onClose }),
  //   [open],
  // );
  // const prompt = React.useCallback<OpenPromptDialog>(
  //   async (msg, { onClose, ...options } = {}) =>
  //     open(PromptDialog, { ...options, msg }, { onClose }),
  //   [open],
  // );
  const confirm = React.useCallback<OpenConfirmDialog>(
    async (msg, { onClose, ...options } = {}) =>
      open(ConfirmDialog, { ...options, msg }, { onClose }),
    [open],
  );

  return useMemo(
    () => ({
      open,
      close,
      // alert,
      // prompt,
      confirm,
    }),
    [close, open, confirm],
  );
};
