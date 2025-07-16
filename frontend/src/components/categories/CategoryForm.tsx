/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from "next/router";
import { FC, Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, RouterType } from "@/services/types";
import { ICategory, ICategoryAttributes } from "@/types/category.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";

export const CategoryForm: FC<ComponentFormProps<ICategory>> = ({
  data: { defaultValues: category },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const router = useRouter();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess: ({ id }: ICategory) => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
      if (router.pathname.startsWith(`/${RouterType.VISUAL_EDITOR}`)) {
        router.push(`/${RouterType.VISUAL_EDITOR}/flows/${id}`);
      }
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
    defaultValues: { label: category?.label || "" },
  });
  const validationRules = {
    label: {
      required: t("message.label_is_required"),
    },
  };
  const onSubmitForm = (params: ICategoryAttributes) => {
    if (category) {
      updateCategory({ id: category.id, params });
    } else {
      createCategory(params);
    }
  };

  useEffect(() => {
    if (category) {
      reset({
        label: category.label,
      });
    } else {
      reset();
    }
  }, [category, reset]);

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
