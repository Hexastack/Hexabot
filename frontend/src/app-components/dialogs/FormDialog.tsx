/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
} from "@mui/material";
import { FC, ReactNode } from "react";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";

export interface FormDialogProps extends DialogProps {
  title: string;
  children: ReactNode;
}

export const FormDialog: FC<FormDialogProps> = ({
  title,
  children,
  open,
  onClose,
  ...rest
}) => {
  return (
    <Dialog open={open} fullWidth onClose={onClose} {...rest}>
      <DialogTitle onClose={onClose}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        {/* <DialogButtons closeDialog={closeDialog} /> */}
      </DialogActions>
    </Dialog>
  );
};
