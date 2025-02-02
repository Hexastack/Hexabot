/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { FC, ReactNode } from "react";

import { ConfirmOptions, DialogProps } from "@/types/common/dialogs.types";

import { DialogTitle } from "../DialogTitle";

import { useDialogLoadingButton } from "./hooks/useDialogLoadingButton";

export interface ConfirmDialogPayload extends ConfirmOptions {
  msg: ReactNode;
}

export interface ConfirmDialogProps
  extends DialogProps<ConfirmDialogPayload, boolean> {}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({ payload, ...rest }) => {
  const cancelButtonProps = useDialogLoadingButton(() => rest.onClose(false));
  const okButtonProps = useDialogLoadingButton(() => rest.onClose(true));

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      {...rest}
      onClose={() => rest.onClose(false)}
    >
      <DialogTitle onClose={() => rest.onClose(false)}>
        {payload.title}
      </DialogTitle>
      <DialogContent>{payload.msg}</DialogContent>
      <DialogActions>
        <Button
          color={payload.severity || "error"}
          variant="contained"
          disabled={!open}
          autoFocus
          {...okButtonProps}
        >
          {payload.okText}
        </Button>
        <Button variant="outlined" disabled={!open} {...cancelButtonProps}>
          {payload.cancelText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
