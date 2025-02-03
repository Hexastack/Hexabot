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

import { FormButtons } from "../buttons/FormButtons";

export const FormDialog = <T,>({
  title,
  children,
  onSubmit,
  ...rest
}: FormDialogProps<T>) => {
  return (
    <Dialog fullWidth {...rest}>
      <DialogTitle onClose={() => rest.onClose?.({}, "backdropClick")}>
        {title}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <FormButtons
          onCancel={() => rest.onClose?.({}, "backdropClick")}
          onConfirm={onSubmit}
        />
      </DialogActions>
    </Dialog>
  );
};
