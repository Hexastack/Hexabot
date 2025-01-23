/*
 * Copyright © 2024 Hexastack. All rights reserved.
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

export type DeleteDialogProps<T = string> = DialogControl<T>;
export const DeleteDialog = <T extends any = string>({
  open,
  closeDialog: closeFunction,
  data: ids,
  callback,
  entity = EntityType.ATTACHMENT,
  onDeleteError = () => {},
  onDeleteSuccess = () => {},
}: DeleteDialogProps<T> & {
  entity?: keyof IEntityMapTypes;
  onDeleteError?: (error: Error) => void;
  onDeleteSuccess?: (data?: unknown) => void;
}) => {
  const { t } = useTranslate();
  const { mutateAsync: deleteEntity } = useDelete(entity, {
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
  });
  const { mutateAsync: deleteEntities } = useDeleteMany(entity, {
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
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
            <Typography>{t("message.item_delete_confirm")}</Typography>
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
            } else {
              if (!Array.isArray(ids)) {
                throw new Error("IDs need to be an Array");
              }

              if (ids.length === 0) {
                throw new Error("IDs cannot be empty");
              }

              if (ids.length === 1) await deleteEntity(ids[0]);
              else if (ids.length > 1) await deleteEntities(ids);
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
