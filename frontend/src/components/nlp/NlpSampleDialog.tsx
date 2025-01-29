/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */


import { Dialog, DialogContent } from "@mui/material";
import { FC } from "react";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import {
  INlpDatasetSample,
  INlpDatasetSampleAttributes,
  INlpSampleFormAttributes,
} from "@/types/nlp-sample.types";

import NlpDatasetSample from "./components/NlpTrainForm";

export type NlpSampleDialogProps = DialogControlProps<INlpDatasetSample>;
export const NlpSampleDialog: FC<NlpSampleDialogProps> = ({
  open,
  data: sample,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { mutate: addSample } = useCreate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes
  >(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
      closeDialog();
    },
  });
  const { mutate: updateSample } = useUpdate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes
  >(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
      closeDialog();
    },
  });
  const onSubmitForm = (form: INlpSampleFormAttributes) => {
    if (sample?.id) {
      updateSample({
        id: sample.id,
        params: {
          text: form.text,
          type: form.type,
          entities: [...form.keywordEntities, ...form.traitEntities],
          language: form.language,
        },
      });
    } else {
      addSample({
        text: form.text,
        type: form.type,
        entities: [...form.keywordEntities, ...form.traitEntities],
        language: form.language,
      });
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={closeDialog} {...rest}>
      <DialogTitle onClose={closeDialog}>
        {sample?.id ? t("title.edit_nlp_sample") : t("title.add_nlp_sample")}
      </DialogTitle>
      <DialogContent>
        <NlpDatasetSample sample={sample} submitForm={onSubmitForm} />
      </DialogContent>
    </Dialog>
  );
};
