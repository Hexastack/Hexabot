/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import CloseIcon from "@mui/icons-material/Close";
import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { FC, useState } from "react";
import { useQuery } from "react-query";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { useApiClient } from "@/hooks/useApiClient";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { IContentType } from "@/types/content-type.types";

export type ContentImportDialogProps = DialogControlProps<{
  contentType?: IContentType;
}>;

export const ContentImportDialog: FC<ContentImportDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const [attachmentId, setAttachementId] = useState<string | null>(null);
  const { t } = useTranslate();
  const { toast } = useToast();
  const { apiClient } = useApiClient();
  const { refetch, isFetching } = useQuery(
    ["importContent", data?.contentType?.id, attachmentId],
    async () => {
      await apiClient.importContent(data?.contentType?.id!, attachmentId!)},
    {
      enabled: false,
      onSuccess: () => {
        handleCloseDialog();
        toast.success(t("message.success_save"));
      },
      onError: () => {
        toast.error(t("message.internal_server_error"));
      },
    }
  );
  const handleCloseDialog = () => {
    closeDialog();
    setAttachementId(null);
  };
  const handleImportClick = () => {
    if (attachmentId && data?.contentType?.id) {
      refetch();
    }
  };

  return (
    <Dialog open={open} fullWidth onClose={handleCloseDialog} {...rest}>
      <DialogTitle onClose={handleCloseDialog}>{t("title.import")}</DialogTitle>
      <DialogContent>
        <ContentContainer>
          <ContentItem>
            <AttachmentInput
              format="basic"
              accept="text/csv"
              onChange={(id, _) => {
                setAttachementId(id);
              }}
              label=""
              value={attachmentId}
            />
          </ContentItem>
        </ContentContainer>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!attachmentId || isFetching}
          onClick={handleImportClick}
        >
          {t("button.import")}
        </Button>
        <Button
          startIcon={<CloseIcon />}
          variant="outlined"
          onClick={handleCloseDialog}
          disabled={isFetching}
        >
          {t("button.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
