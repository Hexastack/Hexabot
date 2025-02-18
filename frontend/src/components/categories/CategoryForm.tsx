/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ICategory, ICategoryAttributes } from "@/types/category.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";

export const CategoryForm: FC<ComponentFormProps<ICategory>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error || t("message.internal_server_error"));
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createCategory } = useCreate(EntityType.CATEGORY, options);
  const { mutate: updateCategory } = useUpdate(EntityType.CATEGORY, options);
  const {
    reset,
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<ICategoryAttributes>({
    defaultValues: { label: data?.label || "" },
  });
  const validationRules = {
    label: {
      required: t("message.label_is_required"),
    },
  };
  const onSubmitForm = (params: ICategoryAttributes) => {
    if (data) {
      updateCategory({ id: data.id, params });
    } else {
      createCategory(params);
    }
  };

  useEffect(() => {
    if (data) {
      reset({
        label: data.label,
      });
    } else {
      reset();
    }
  }, [data, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.label")}
              error={!!errors.label}
              {...register("label", validationRules.label)}
              required
              autoFocus
              helperText={errors.label ? errors.label.message : null}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
