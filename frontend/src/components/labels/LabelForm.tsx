/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { FC, Fragment, useEffect } from "react";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useStrictForm } from "@/hooks/useStrictForm";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ILabel, ILabelAttributes } from "@/types/label.types";
import { slugify } from "@/utils/string";

export const LabelForm: FC<ComponentFormProps<ILabel>> = ({
  data: { defaultValues: label },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error.message || t("message.internal_server_error"));
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createLabel } = useCreate(EntityType.LABEL, options);
  const { mutate: updateLabel } = useUpdate(EntityType.LABEL, options);
  const {
    reset,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useStrictForm<ILabelAttributes>({
    defaultValues: {
      name: label?.name || "",
      title: label?.title || "",
      description: label?.description || "",
    },
    rules: {
      title: {
        required: t("message.title_is_required"),
      },
    },
  });
  const onSubmitForm = (params: ILabelAttributes) => {
    if (label) {
      updateLabel({ id: label.id, params });
    } else {
      createLabel(params);
    }
  };

  useEffect(() => {
    if (label) {
      reset({
        name: label.name,
        title: label.title,
        description: label.description,
      });
    } else {
      reset();
    }
  }, [label, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("placeholder.title")}
              error={!!errors.title}
              required
              autoFocus
              {...register("title")}
              InputProps={{
                onChange: ({ target: { value } }) => {
                  setValue("title", value);
                  setValue("name", slugify(value).toUpperCase());
                },
              }}
              helperText={errors.title ? errors.title.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              placeholder={t("placeholder.name")}
              error={!!errors.name}
              {...register("name")}
              disabled
              helperText={errors.name ? errors.name.message : null}
            />
          </ContentItem>
          <ContentItem>
            <Input
              label={t("label.description")}
              error={!!errors.description}
              {...register("description")}
              helperText={
                errors.description ? errors.description.message : null
              }
              multiline={true}
            />
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
