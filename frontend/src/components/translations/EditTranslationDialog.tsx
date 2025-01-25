/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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

import DialogButtons from "@/app-components/buttons/DialogButtons";
import { DialogTitle } from "@/app-components/dialogs/DialogTitle";
import { ContentContainer } from "@/app-components/dialogs/layouts/ContentContainer";
import { ContentItem } from "@/app-components/dialogs/layouts/ContentItem";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { DialogControlProps } from "@/hooks/useDialog";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
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
  datum: translation,
  closeDialog,
  ...rest
}) => {
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { t } = useTranslate();
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
    defaultValues: translation,
  });
  const onSubmitForm = async (params: ITranslationAttributes) => {
    if (translation?.id) updateTranslation({ id: translation.id, params });
  };

  useEffect(() => {
    if (open) reset(translation);
  }, [open, reset, translation]);

  return (
    <Dialog open={open} fullWidth onClose={closeDialog} {...rest}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <DialogTitle onClose={closeDialog}>
          {t("title.update_translation")}
        </DialogTitle>
        <DialogContent>
          <ContentItem>
            <FormLabel>{t("label.original_text")}</FormLabel>
            <Typography component="p">{translation?.str}</Typography>
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
