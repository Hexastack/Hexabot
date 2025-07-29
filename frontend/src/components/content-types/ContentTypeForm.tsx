/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { FC, Fragment } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  ContentFieldType,
  IContentType,
  IContentTypeAttributes,
} from "@/types/content-type.types";

import { FieldInput } from "./components/FieldInput";
import { FIELDS_FORM_DEFAULT_VALUES } from "./constants";

export const ContentTypeForm: FC<ComponentFormProps<IContentType>> = ({
  data: { defaultValues: contentType },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { toast } = useToast();
  const { t } = useTranslate();
  const {
    control,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<IContentType>({
    defaultValues: contentType
      ? { name: contentType.name, fields: contentType.fields }
      : {
          name: "",
          fields: FIELDS_FORM_DEFAULT_VALUES,
        },
  });
  const { append, fields, remove } = useFieldArray({
    name: "fields",
    rules: {
      validate: (fields) => {
        const hasUniqueLabels =
          new Set(fields.map((f) => f["label"] as string)).size ===
          fields.length;

        if (!hasUniqueLabels) {
          toast.error(t("message.duplicate_labels_not_allowed"));

          return false;
        }

        return true;
      },
    },
    control,
  });
  const options = {
    onError: (error: Error) => {
      rest.onError?.();
      toast.error(error);
    },
    onSuccess: () => {
      rest.onSuccess?.();
      toast.success(t("message.success_save"));
    },
  };
  const { mutate: createContentType } = useCreate(
    EntityType.CONTENT_TYPE,
    options,
  );
  const { mutate: updateContentType } = useUpdate(
    EntityType.CONTENT_TYPE,
    options,
  );
  const onSubmitForm = (params: IContentTypeAttributes) => {
    if (contentType?.id) {
      updateContentType({ id: contentType.id, params });
    } else {
      createContentType(params);
    }
  };

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          <ContentItem>
            <Input
              label={t("label.name")}
              error={!!errors.name}
              {...register("name", {
                required: t("message.name_is_required"),
              })}
              helperText={errors.name ? errors.name.message : null}
              required
              autoFocus
            />
          </ContentItem>
          {fields.map((field, idx) => (
            <ContentItem
              key={field.id}
              display="flex"
              justifyContent="space-between"
              gap={2}
            >
              <FieldInput
                idx={idx}
                name={field.name}
                remove={remove}
                control={control}
                setValue={setValue}
              />
            </ContentItem>
          ))}
          <ContentItem>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() =>
                append({
                  label: "",
                  name: "",
                  type: ContentFieldType.TEXT,
                })
              }
            >
              {t("button.add")}
            </Button>
          </ContentItem>
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
