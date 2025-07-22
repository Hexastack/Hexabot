/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FormLabel, Grid, Typography } from "@mui/material";
import { FC, Fragment } from "react";
import { Controller, ControllerRenderProps, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useFind } from "@/hooks/crud/useFind";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ILanguage } from "@/types/language.types";
import {
  ITranslation,
  ITranslationAttributes,
  ITranslations,
} from "@/types/translation.types";

interface TranslationInputProps {
  field: ControllerRenderProps<ITranslationAttributes>;
  language: ILanguage;
}

const TranslationInput: React.FC<TranslationInputProps> = ({
  field,
  language: { isRTL, title },
}) => (
  <Input
    dir={isRTL ? "rtl" : "ltr"}
    label={
      <Grid container dir="ltr">
        <Grid>{title}</Grid>
      </Grid>
    }
    minRows={3}
    inputRef={field.ref}
    multiline={true}
    {...field}
  />
);

export const TranslationForm: FC<ComponentFormProps<ITranslation>> = ({
  data: { defaultValues: translation },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { data: languages } = useFind(
    { entity: EntityType.LANGUAGE },
    {
      hasCount: false,
    },
  );
  const { mutate: updateTranslation } = useUpdate(EntityType.TRANSLATION, {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  });
  const { control, handleSubmit } = useForm<ITranslationAttributes>({
    defaultValues: {
      translations: translation?.translations,
    },
  });
  const onSubmitForm = (params: ITranslationAttributes) => {
    if (translation?.id) updateTranslation({ id: translation.id, params });
  };

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
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
                  name={`translations.${language.code as keyof ITranslations}`}
                  control={control}
                  render={({ field }) => (
                    <TranslationInput field={field} language={language} />
                  )}
                />
              </ContentItem>
            ))}
        </ContentContainer>
      </form>
    </Wrapper>
  );
};

TranslationForm.displayName = TranslationForm.name;
