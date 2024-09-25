/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Dialog,
  DialogActions,
  DialogContent,
  FormLabel,
  Typography,
} from "@mui/material";
import { FC, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { EntityType } from "@/services/types";
import {
  ITranslation,
  ITranslationAttributes,
  ITranslations,
} from "@/types/translation.types";

import TranslationInput from "./TranslationInput";

export type EditTranslationDialogProps = DialogControlProps<ITranslation>;
export const EditTranslationDialog: FC<EditTranslationDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { t } = useTranslation();
  const { toast } = useToast();
  const { mutateAsync: updateTranslation } = useUpdate(EntityType.TRANSLATION, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const { reset, control, handleSubmit } = useForm<ITranslationAttributes>({
    defaultValues: data,
  });
  const onSubmitForm = async (params: ITranslationAttributes) => {
    if (data?.id) updateTranslation({ id: data.id, params });
  };

  useEffect(() => {
    if (open) reset(data);
  }, [open, reset, data]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {t("title.update_translation")}
        </DialogTitle>
        <DialogContent>
          <ContentItem>
            <FormLabel>{t("label.original_text")}</FormLabel>
            <Typography component="p">{data?.str}</Typography>
          </ContentItem>
          <ContentContainer>
            {languages
              .filter(({ isDefault }) => !isDefault)
              .map((language) => (
                <ContentItem key={language.code}>
                  <Controller
                    name={`translations.${
                      language.code as keyof ITranslations
                    }`}
                    control={control}
                    render={({ field }) => (
                      <TranslationInput field={field} language={language} />
                    )}
                  />
                </ContentItem>
              ))}
          </ContentContainer>
        </DialogContent>
        <DialogActions>
          <DialogButtons closeDialog={closeDialog} />
        </DialogActions>
      </form>
    </Dialog>
  );
};
