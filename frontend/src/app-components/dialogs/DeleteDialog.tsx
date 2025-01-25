/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import ErrorIcon from "@mui/icons-material/Error";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
} from "@mui/material";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { useDelete } from "@/hooks/crud/useDelete";
import { useDeleteMany } from "@/hooks/crud/useDeleteMany";
import { DialogControl } from "@/hooks/useDialog";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";

export type DeleteDialogProps<T extends string = string> = DialogControl<T>;
export const DeleteDialog = <T extends string = string>({
  open,
  closeDialog: closeFunction,
  datum,
  data: ids,
  callback,
  entity = EntityType.ATTACHMENT,
  setData,
  onDeleteError = () => {},
  onDeleteSuccess = () => {},
}: DeleteDialogProps<T> & {
  entity?: keyof IEntityMapTypes;
  onDeleteError?: (error: Error) => void;
  onDeleteSuccess?: (data?: unknown) => void;
}) => {
  const { t } = useTranslate();
  const getItemsFromData = (data: unknown) => (Array.isArray(data) ? data : []);
  const hasMultipleItems = (data: unknown): boolean =>
    getItemsFromData(data).length > 1;
  const onSuccess = (data: unknown) => {
    setData?.(undefined);
    onDeleteSuccess(data);
  };
  const { mutateAsync: deleteOne } = useDelete(entity, {
    onError: onDeleteError,
    onSuccess,
  });
  const { mutateAsync: deleteMany } = useDeleteMany(entity, {
    onError: onDeleteError,
    onSuccess,
  });

  return (
    <Dialog open={open} fullWidth onClose={closeFunction}>
      <DialogTitle onClose={closeFunction}>{t("title.warning")}</DialogTitle>
      <DialogContent>
        <Grid container gap={1}>
          <Grid item height="28px">
            <ErrorIcon sx={{ fontSize: "28px" }} color="error" />
          </Grid>
          <Grid item alignSelf="center">
            <Typography>
              {t(
                `${
                  hasMultipleItems(ids)
                    ? "message.items_delete_confirm"
                    : "message.item_delete_confirm"
                }`,
                { "0": getItemsFromData(ids).length.toString() },
              )}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          variant="contained"
          onClick={async () => {
            if (callback) {
              callback(ids);
            } else if (Array.isArray(ids)) {
              await deleteMany(ids);
            } else if (datum) {
              await deleteOne(datum);
            }
          }}
          autoFocus
        >
          {t("button.yes")}
        </Button>
        <Button variant="outlined" onClick={closeFunction}>
          {t("button.no")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
