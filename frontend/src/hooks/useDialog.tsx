/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { DialogProps } from "@mui/material";
import { useState } from "react";

export type DialogControlProps<T> = Omit<DialogControl<T>, "openDialog">;
type TCloseDialog = <E extends React.MouseEvent | Event | Object>(
  e?: E,
  reason?: "backdropClick" | "escapeKeyDown",
) => void;
type TFnVoid<T> = (data?: T) => void;
type TStatesMode = "datumOrData" | "datumAndData";
export type DialogControl<T = never> = Omit<DialogProps, "onError"> & {
  data?: T[];
  datum?: T;
  reset?: () => void;
  setData?: TFnVoid<T[]>;
  setDatum?: TFnVoid<T>;
  callback?: (data?: T | T[]) => Promise<void>;
  openDialog: TFnVoid<T | T[]>;
  closeDialog: TCloseDialog;
};

export const useDialog = <T,>(
  initialState: boolean,
  statesMode: TStatesMode = "datumOrData",
): DialogControl<T> => {
  const [open, setOpen] = useState(initialState);
  const [data, setData] = useState<T[] | undefined>();
  const [datum, setDatum] = useState<T | undefined>();
  const openDialog: TFnVoid<T | T[]> = (value) => {
    if (statesMode === "datumOrData") {
      if (value) {
        setData(Array.isArray(value) ? value : undefined);
        setDatum(Array.isArray(value) ? undefined : value);
      }
    } else if (statesMode === "datumAndData") {
      setData(Array.isArray(value) ? value : data);
      setDatum(Array.isArray(value) ? datum : value);
    }
    setOpen(true);
  };
  const closeDialog: TCloseDialog = (event, reason) => {
    if (reason !== "backdropClick") {
      setOpen(false);
    }
  };
  const reset = () => {
    setOpen(false);
    setData(undefined);
    setDatum(undefined);
  };

  return {
    open,
    data,
    datum,
    reset,
    setData,
    setDatum,
    openDialog,
    closeDialog,
  };
};

export const getDisplayDialogs = <T,>({
  open,
  datum,
  closeDialog,
}: DialogControl<T>): DialogControlProps<T> => ({ open, datum, closeDialog });
