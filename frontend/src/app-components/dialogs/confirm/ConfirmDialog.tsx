/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
} from "@mui/material";
import { cloneElement, FC, ReactNode } from "react";

import { useTranslate } from "@/hooks/useTranslate";
import { ConfirmOptions, DialogProps } from "@/types/common/dialogs.types";

import { DialogTitle } from "../DialogTitle";

import { useDialogLoadingButton } from "./hooks/useDialogLoadingButton";

export interface ConfirmDialogPayload extends ConfirmOptions {
  msg: ReactNode;
}

export interface ConfirmDialogProps
  extends DialogProps<ConfirmDialogPayload, boolean> {
  mode?: "selection" | "click";
  count?: number;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({ payload, ...rest }) => {
  const { t } = useTranslate();
  const cancelButtonProps = useDialogLoadingButton(() => rest.onClose(false));
  const okButtonProps = useDialogLoadingButton(() => rest.onClose(true));
  // @ts-ignore
  const messageReactNode = cloneElement(payload.msg, {
    mode: rest.mode,
    count: rest.count,
  });

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      {...rest}
      onClose={() => rest.onClose(false)}
    >
      <DialogTitle onClose={() => rest.onClose(false)}>
        {payload.title || t("title.warning")}
      </DialogTitle>
      <DialogContent>{messageReactNode}</DialogContent>
      <DialogActions style={{ padding: "0.5rem" }}>
        <Grid p="0.3rem 1rem" gap="0.5rem" display="flex">
          <Button
            color={payload.severity || "error"}
            variant="contained"
            disabled={!open}
            autoFocus
            {...okButtonProps}
          >
            {payload.okText || t("label.yes")}
          </Button>
          <Button variant="outlined" disabled={!open} {...cancelButtonProps}>
            {payload.cancelText || t("label.no")}
          </Button>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};
