/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Dialog, DialogContent } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const { mutateAsync: updateSample } = useUpdate<
    EntityType.NLP_SAMPLE,
    INlpDatasetSampleAttributes
  >(EntityType.NLP_SAMPLE, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess: () => {
      toast.success(t("message.success_save"));
    },
  });
  const onSubmitForm = (form: INlpSampleFormAttributes) => {
    if (sample?.id) {
      updateSample(
        {
          id: sample.id,
          params: {
            text: form.text,
            type: form.type,
            entities: [...form.keywordEntities, ...form.traitEntities],
            language: form.language,
          },
        },
        {
          onSuccess: () => {
            closeDialog();
          },
        },
      );
    }
  };

  return (
    <Dialog open={open} fullWidth maxWidth="md" onClose={closeDialog} {...rest}>
      <DialogTitle onClose={closeDialog}>
        {t("title.edit_nlp_sample")}
      </DialogTitle>
      <DialogContent>
        <NlpDatasetSample sample={sample} submitForm={onSubmitForm} />
      </DialogContent>
    </Dialog>
  );
};
