/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import { ContentFieldType, IContentType } from "@/types/content-type.types";

import { FieldInput } from "./components/FieldInput";
import { FIELDS_FORM_DEFAULT_VALUES, READ_ONLY_FIELDS } from "./constants";

export const ContentTypeForm: FC<ComponentFormProps<IContentType>> = ({
  data,
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { toast } = useToast();
  const { t } = useTranslate();
  const {
    reset,
    control,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<Partial<IContentType>>({
    defaultValues: {
      name: data?.name || "",
      fields: data?.fields || FIELDS_FORM_DEFAULT_VALUES,
    },
  });
  const { append, fields, remove } = useFieldArray({
    name: "fields",
    control,
  });
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
  const { mutate: createContentType } = useCreate(
    EntityType.CONTENT_TYPE,
    options,
  );
  const { mutate: updateContentType } = useUpdate(
    EntityType.CONTENT_TYPE,
    options,
  );
  const onSubmitForm = (params) => {
    const labelCounts: Record<string, number> = params.fields.reduce(
      (acc, field) => {
        if (!field.label.trim()) return acc;
        acc[field.label] = (acc[field.label] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );
    const hasDuplicates = Object.values(labelCounts).some(
      (count: number) => count > 1,
    );

    if (hasDuplicates) {
      toast.error(t("message.duplicate_labels_not_allowed"));

      return;
    }

    if (data) {
      updateContentType({ id: data.id, params });
    } else {
      createContentType(params);
    }
  };

  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        fields: data.fields || FIELDS_FORM_DEFAULT_VALUES,
      });
    } else {
      reset({ name: "", fields: FIELDS_FORM_DEFAULT_VALUES });
    }
  }, [data, reset]);

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

          {fields.map((f, index) => (
            <ContentItem
              key={f.id}
              display="flex"
              justifyContent="space-between"
              gap={2}
            >
              <FieldInput
                setValue={setValue}
                control={control}
                remove={remove}
                index={index}
                disabled={READ_ONLY_FIELDS.includes(f.label as any)}
              />
            </ContentItem>
          ))}
          <ContentItem>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() =>
                append({ label: "", name: "", type: ContentFieldType.TEXT })
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
