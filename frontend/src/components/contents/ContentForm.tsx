/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import LinkIcon from "@mui/icons-material/Link";
import { FormControl, FormControlLabel, Switch } from "@mui/material";
import { FC, Fragment, useEffect } from "react";
import {
  Controller,
  ControllerRenderProps,
  FieldErrors,
  useForm,
} from "react-hook-form";

import AttachmentInput from "@/app-components/attachment/AttachmentInput";
import { ContentContainer, ContentItem } from "@/app-components/dialogs";
import { Adornment } from "@/app-components/inputs/Adornment";
import { Input } from "@/app-components/inputs/Input";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  ContentField,
  ContentFieldType,
  IContentType,
} from "@/types/content-type.types";
import { IContent, IContentAttributes } from "@/types/content.types";
import { MIME_TYPES } from "@/utils/attachment";
import { isAbsoluteUrl } from "@/utils/URL";

interface ContentFieldInput {
  contentField: ContentField;
  field: ControllerRenderProps<any, string>;
  errors: FieldErrors<
    IContentAttributes & {
      [key: string]: any;
    }
  >;
  idx: number;
}
const ContentFieldInput: React.FC<ContentFieldInput> = ({
  contentField: contentField,
  field,
  errors,
  idx,
}) => {
  const { t } = useTranslate();

  switch (contentField.type) {
    case ContentFieldType.TEXT:
    case ContentFieldType.TEXTAREA:
    case ContentFieldType.URL:
      return (
        <Input
          autoFocus={idx === 0}
          multiline={contentField.type === ContentFieldType.TEXTAREA}
          rows={contentField.type === ContentFieldType.TEXTAREA ? 5 : 1}
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          InputProps={
            contentField.type === ContentFieldType.URL
              ? {
                  startAdornment: <Adornment Icon={LinkIcon} />,
                }
              : undefined
          }
          {...field}
          error={!!errors[contentField.name]}
          helperText={
            errors[contentField.name] ? (
              <>{errors[contentField.name]?.message}</>
            ) : null
          }
        />
      );
    case ContentFieldType.CHECKBOX:
      return (
        <FormControlLabel
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          {...field}
          control={<Switch checked={field.value} />}
        />
      );
    case ContentFieldType.FILE:
      return (
        <AttachmentInput
          label={t(`label.${contentField.name}`, {
            defaultValue: contentField.label,
          })}
          {...field}
          onChange={(id, mimeType) => {
            field.onChange({ type: mimeType, payload: { id } });
          }}
          value={field.value?.payload?.id}
          accept={MIME_TYPES["images"].join(",")}
          format="full"
          size={256}
          resourceRef={AttachmentResourceRef.ContentAttachment}
        />
      );
    default:
      return <Input {...field} error={!!errors[contentField.name]} />;
  }
};
const INITIAL_FIELDS = ["title", "status"];
const buildDynamicFields = (
  content: IContentAttributes,
  contentType?: IContentType,
) => ({
  title: content.title,
  entity: content.entity,
  status: content.status,
  dynamicFields: {
    ...contentType?.fields
      ?.filter(({ name }) => !INITIAL_FIELDS.includes(name))
      .reduce((acc, { name }) => ({ ...acc, [name]: content[name] }), {}),
  },
});

export const ContentForm: FC<ComponentFormProps<IContent, IContentType>> = ({
  data: { defaultValues: content, presetValues: contentType },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const {
    reset,
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<IContentAttributes & { [key: string]: any }>({
    defaultValues: {
      entity: content?.entity || "",
      status: content?.status || false,
      title: content?.title || "",
    },
  });
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    url: {
      required: t("message.url_is_invalid"),
      validate: (value: string) =>
        isAbsoluteUrl(value) || t("message.url_is_invalid"),
    },
  };
  const { mutate: createContent } = useCreate(EntityType.CONTENT);
  const { mutate: updateContent } = useUpdate(EntityType.CONTENT);
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
  const onSubmitForm = (params: IContentAttributes) => {
    if (content) {
      updateContent(
        { id: content.id, params: buildDynamicFields(params, contentType) },
        options,
      );
    } else if (contentType) {
      createContent(
        { ...buildDynamicFields(params, contentType), entity: contentType.id },
        options,
      );
    } else {
      throw new Error("Content Type must be passed to the dialog form.");
    }
  };

  useEffect(() => {
    if (content) {
      reset(content);
    } else {
      reset();
    }
  }, [content, reset]);

  return (
    <Wrapper onSubmit={handleSubmit(onSubmitForm)} {...WrapperProps}>
      <form onSubmit={handleSubmit(onSubmitForm)}>
        <ContentContainer>
          {(contentType?.fields || []).map((contentField, index) => (
            <ContentItem key={contentField.name}>
              <Controller
                name={contentField.name}
                control={control}
                defaultValue={
                  content ? content["dynamicFields"][contentField.name] : null
                }
                rules={
                  contentField.name === "title"
                    ? validationRules.title
                    : contentField.type === ContentFieldType.URL
                    ? validationRules.url
                    : undefined
                }
                render={({ field }) => (
                  <FormControl fullWidth sx={{ paddingTop: ".75rem" }}>
                    <ContentFieldInput
                      contentField={contentField}
                      field={field}
                      errors={errors}
                      idx={index}
                    />
                  </FormControl>
                )}
              />
            </ContentItem>
          ))}
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
