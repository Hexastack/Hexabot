/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import ErrorIcon from '@mui/icons-material/Error';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  Typography,
} from '@mui/material';

import { DialogTitle } from '@/app-components/dialogs/DialogTitle';
import { DialogControl } from '@/hooks/useDialog';
import { useTranslate } from '@/hooks/useTranslate';

export type DeleteDialogProps<T = string> = DialogControl<T>;
export const DeleteDialog = <T extends any = string>({
  open,
  callback,
  closeDialog: closeFunction,
}: DeleteDialogProps<T>) => {
  const { t } = useTranslate();

  return (
    <Dialog open={open} fullWidth onClose={closeFunction}>
      <DialogTitle onClose={closeFunction}>{t('title.warning')}</DialogTitle>
      <DialogContent>
        <Grid container gap={1}>
          <Grid item height="28px">
            <ErrorIcon sx={{ fontSize: '28px' }} color="error" />
          </Grid>
          <Grid item alignSelf="center">
            <Typography>{t('message.item_delete_confirm')}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            if (callback) {
              callback();
            }
          }}
          autoFocus
        >
          {t('button.yes')}
        </Button>
        <Button variant="outlined" onClick={closeFunction}>
          {t('button.no')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
