/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FormControlLabel, Switch } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ILanguage, ILanguageAttributes } from "@/types/language.types";

export const LanguageForm: FC<ComponentFormProps<ILanguage>> = ({
  data: { defaultValues: language },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: () => {
      rest.onError?.();
      toast.error(t("message.internal_server_error"));
    },
    onSuccess() {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createLanguage } = useCreate(EntityType.LANGUAGE, options);
  const { mutate: updateLanguage } = useUpdate(EntityType.LANGUAGE, options);
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
    control,
  } = useForm<ILanguageAttributes>({
    defaultValues: {
      title: language?.title || "",
      code: language?.code || "",
      isRTL: language?.isRTL || false,
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    code: {
      required: t("message.code_is_required"),
    },
  };
  const onSubmitForm = (params: ILanguageAttributes) => {
    if (language) {
      updateLanguage({ id: language.id, params });
    } else {
      createLanguage(params);
    }
  };

  useEffect(() => {
    if (language) {
      reset({
        title: language.title,
        code: language.code,
        isRTL: language.isRTL,
      });
    } else {
      reset();
    }
  }, [language, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("label.title")}
              error={!!errors.title}
              {...register("title", validationRules.title)}
              multiline={true}
              autoFocus
              helperText={errors.title ? errors.title.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.code")}
              error={!!errors.code}
              {...register("code", validationRules.code)}
              multiline={true}
              helperText={errors.code ? errors.code.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Controller
              name="isRTL"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={t("label.is_rtl")}
                />
              )}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
