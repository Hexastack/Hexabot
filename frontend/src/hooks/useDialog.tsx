/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { DialogProps } from "@mui/material";
import { useState } from "react";

export type DialogControlProps<T, C = never> = Omit<
  DialogControl<T, C>,
  "openDialog"
>;
export type DialogControl<T = null, C = never> = DialogProps & {
  data?: T;
  callback?: (data: C) => void;
  openDialog: (data?: T) => void;
  closeDialog: () => void;
};

export const useDialog = <T,>(initialState: boolean): DialogControl<T> => {
  const [open, setOpen] = useState(initialState);
  const [data, setData] = useState<T | undefined>(undefined);
  const openDialog = (data?: T) => {
    if (data) setData(data);
    setOpen(true);
  };
  const closeDialog = (event?: React.MouseEvent | Event, reason?: string) => {
    if (reason !== "backdropClick") {
      setOpen(false);
    }
  };

  return { open, openDialog, closeDialog, data };
};

export const getDisplayDialogs = <T,>({
  open,
  closeDialog,
  data,
}: DialogControl<T>): DialogControlProps<T> => ({ open, closeDialog, data });
