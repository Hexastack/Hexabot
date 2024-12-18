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
import { useMutation, useQueryClient } from "react-query";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { isSameEntity } from "@/hooks/crud/helpers";
import { useApiClient } from "@/hooks/useApiClient";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";

export type NlpImportDialogProps = DialogControlProps<never>;

export const NlpImportDialog: FC<NlpImportDialogProps> = ({
  open,
  closeDialog,
  ...rest
}) => {
  const [attachmentId, setAttachmentId] = useState<string | null>(null);
  const { t } = useTranslate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { apiClient } = useApiClient();
  const { mutateAsync: importNlpSamples, isLoading: isImporting } = useMutation(
    {
      mutationFn: async (attachmentId: string | null) => {
        attachmentId && (await apiClient.importNlpSamples(attachmentId));
      },
      onSuccess: () => {
        queryClient.removeQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              ((qType === QueryType.count || qType === QueryType.collection) &&
                isSameEntity(qEntity, EntityType.NLP_SAMPLE)) ||
              isSameEntity(qEntity, EntityType.NLP_SAMPLE_ENTITY) ||
              isSameEntity(qEntity, EntityType.NLP_ENTITY) ||
              isSameEntity(qEntity, EntityType.NLP_VALUE)
            );
          },
        });
        handleCloseDialog();
        toast.success(t("message.success_save"));
      },
      onError() {
        toast.error(t("message.internal_server_error"));
      },
    },
  );
  const handleCloseDialog = () => {
    closeDialog();
    setAttachmentId(null);
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
                setAttachmentId(id);
              }}
              label=""
              value={attachmentId}
            />
          </ContentItem>
        </ContentContainer>
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!attachmentId || isImporting}
          onClick={() => importNlpSamples(attachmentId)}
        >
          {t("button.import")}
        </Button>
        <Button
          startIcon={<CloseIcon />}
          variant="outlined"
          onClick={handleCloseDialog}
          disabled={isImporting}
        >
          {t("button.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
