/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Button, Dialog, DialogActions, DialogContent } from '@mui/material';
import { GridEventListener } from '@mui/x-data-grid';
import { FC, useEffect, useState } from 'react';

import { DialogTitle } from '@/app-components/dialogs/DialogTitle';
import { MediaLibrary } from '@/components/media-library';
import { DialogControlProps } from '@/hooks/useDialog';
import { useTranslate } from '@/hooks/useTranslate';
import { IAttachment } from '@/types/attachment.types';

export type AttachmentDialogProps = DialogControlProps<
  never,
  IAttachment | null
> & { accept: string };

export const AttachmentDialog: FC<AttachmentDialogProps> = ({
  open,
  closeDialog,
  callback,
  accept,
  ...rest
}) => {
  const { t } = useTranslate();
  const [selected, setSelected] = useState<IAttachment | null>(null);
  const handleSelection: GridEventListener<'rowClick'> = (data) => {
    setSelected(data.row);
  };

  useEffect(() => {
    if (!open) {
      setSelected(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={closeDialog} {...rest} fullWidth maxWidth="lg">
      <DialogTitle onClose={closeDialog}>
        {t('title.media_library')}
      </DialogTitle>
      <DialogContent>
        <MediaLibrary
          showTitle={false}
          onSelect={handleSelection}
          accept={accept}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          disabled={!selected}
          onClick={() => {
            callback && callback(selected);
            closeDialog();
          }}
        >
          {t('button.select')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
