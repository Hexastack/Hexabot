/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, FC, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useSetting } from "@/hooks/useSetting";
import { useToast } from "@/hooks/useToast";
import { EntityType } from "@/services/types";
import {
  ITranslationAttributes,
  ITranslations,
  ITranslation,
} from "@/types/translation.types";

import TranslationInput from "./TranslationInput";

export type EditTranslationDialogProps = DialogControlProps<ITranslation>;
export const EditTranslationDialog: FC<EditTranslationDialogProps> = ({
  open,
  data,
  closeDialog,
  ...rest
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const availableLanguages = useSetting("nlp_settings", "languages");
  const defaultLanguage = useSetting("nlp_settings", "default_lang");
  const { mutateAsync: updateTranslation } = useUpdate(EntityType.TRANSLATION, {
    onError: () => {
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      closeDialog();
      toast.success(t("message.success_save"));
    },
  });
  const defaultValues: ITranslation | undefined = useMemo(
    () =>
      data
        ? {
            ...data,
            translations: {
              ...data?.translations,
              [defaultLanguage]: data?.str,
            },
          }
        : undefined,
    [defaultLanguage, data],
  );
  const { reset, control, handleSubmit } = useForm<ITranslationAttributes>({
    defaultValues,
  });
  const onSubmitForm = async (params: ITranslationAttributes) => {
    if (data?.id) updateTranslation({ id: data.id, params });
  };

  useEffect(() => {
    if (open) reset(defaultValues);
  }, [open, reset, defaultValues]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {t("title.update_translation")}
        </DialogTitle>
        <DialogContent>
          <ContentContainer>
            {availableLanguages?.map((language: string) => (
              <ContentItem key={language}>
                <Controller
                  name={`translations.${language as keyof ITranslations}`}
                  control={control}
                  render={({ field }) => (
                    <TranslationInput
                      field={field}
                      language={language as keyof ITranslations}
                    />
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
