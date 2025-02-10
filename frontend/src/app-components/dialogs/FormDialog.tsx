/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Dialog, DialogActions, DialogContent } from "@mui/material";

import { DialogTitle } from "@/app-components/dialogs";
import { FormDialogProps } from "@/types/common/dialogs.types";

import { DialogFormButtons } from "../buttons/FormButtons";

export const FormDialog = ({
  title,
  children,
  onSubmit,
  cancelButtonProps,
  confirmButtonProps,
  ...rest
}: FormDialogProps) => {
  const onCancel = () => rest.onClose?.({}, "backdropClick");
  const dialogActions =
    rest.hasButtons === false ? null : (
      <DialogActions style={{ padding: "0.5rem" }}>
        <DialogFormButtons
          {...{ onSubmit, onCancel, confirmButtonProps, cancelButtonProps }}
        />
      </DialogActions>
    );

  return (
    <Dialog open={!!rest?.open} fullWidth {...rest}>
      <DialogTitle onClose={onCancel}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {dialogActions}
    </Dialog>
  );
};
