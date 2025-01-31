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
import { DialogControl } from "@/hooks/useDialog2";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";

export type DeleteDialogProps<T extends string = string> = DialogControl<T>;
export const DeleteDialog = <T extends string = string>({
  data: ids,
  entity = EntityType.ATTACHMENT,
  onError = () => {},
  onSuccess = () => {},
  ...rest
}: DeleteDialogProps<T> & {
  entity?: keyof IEntityMapTypes;
  onError?: (error: Error) => void;
  onSuccess?: (data?: unknown) => void;
}) => {
  const { t } = useTranslate();
  const options = {
    onError,
    onSuccess: (data: unknown) => {
      onSuccess(data);
      rest.reset?.();
    },
  };
  const { mutateAsync: deleteOne } = useDelete(entity, options);
  const { mutateAsync: deleteMany } = useDeleteMany(entity, options);

  return (
    <Dialog open={rest.open} fullWidth onClose={rest.closeDialog}>
      <DialogTitle onClose={rest.closeDialog}>{t("title.warning")}</DialogTitle>
      <DialogContent>
        <Grid container gap={1}>
          <Grid item height="28px">
            <ErrorIcon sx={{ fontSize: "28px" }} color="error" />
          </Grid>
          <Grid item alignSelf="center">
            <Typography>
              {t(
                `message.item${
                  (ids?.length || 0) > 1 ? "s" : ""
                }_delete_confirm`,
                {
                  "0":
                    ids?.length === 1
                      ? t("message.selected")
                      : ids?.length.toString(),
                },
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
            if (rest.callback) {
              rest.callback(ids);
            } else if (Array.isArray(ids)) {
              await deleteMany(ids);
            } else if (rest.datum) {
              await deleteOne(rest.datum);
            }
          }}
          autoFocus
        >
          {t("button.yes")}
        </Button>
        <Button variant="outlined" onClick={rest.closeDialog}>
          {t("button.no")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
