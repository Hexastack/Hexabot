/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { LinkIcon } from "lucide-react";
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
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useNormalizeSchema } from "@/hooks/useNormalizeSchema";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { AttachmentResourceRef } from "@/types/attachment.types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  ContentField,
  ContentSchemaProperties,
  IContentType,
} from "@/types/content-type.types";
import { IContent, IContentAttributes } from "@/types/content.types";
import { MIME_TYPES } from "@/utils/attachment";
import { slugify } from "@/utils/string";

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
    case "string":
    case "textarea":
    case "uri":
      return (
        <TextField
          autoFocus={idx === 0}
          multiline={contentField.type === "textarea"}
          rows={contentField.type === "textarea" ? 5 : 1}
          label={t(`label.${contentField.title}`, {
            defaultValue: contentField.title,
          })}
          slotProps={
            contentField.type === "uri"
              ? {
                  input: {
                    startAdornment: <Adornment Icon={LinkIcon} />,
                  },
                }
              : undefined
          }
          {...field}
          error={!!errors[contentField.name]}
          helperText={
            errors[contentField.title] ? (
              <>{errors[contentField.title]?.message}</>
            ) : null
          }
        />
      );
    case "boolean":
      return (
        <FormControlLabel
          label={t(`label.${contentField.title}`, {
            defaultValue: contentField.title,
          })}
          {...field}
          control={<Switch checked={field.value} />}
        />
      );
    case "file":
      return (
        <AttachmentInput
          label={t(`label.${contentField.title}`, {
            defaultValue: contentField.title,
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
      return <TextField {...field} error={!!errors[contentField.name]} />;
  }
};
const buildContentParams = (
  params: IContentAttributes,
  properties: ContentSchemaProperties = {},
) => {
  const writableProperties = Object.entries(properties).reduce((acc, [key]) => {
    if (!["status", "title"].includes(key)) {
      acc[key] = params[key];
    }

    return acc;
  }, {});

  return {
    title: params.title,
    contentType: params.contentType,
    status: params.status,
    properties: writableProperties,
  };
};

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
      contentType: content?.contentType || "",
      status: content?.status || false,
      title: content?.title || "",
    },
  });
  const { getNormalizedSchema } = useNormalizeSchema();
  const { schemaRules, properties } = getNormalizedSchema(contentType?.schema);
  const validationRules = {
    title: {
      required: t("message.title_is_required"),
    },
    ...schemaRules,
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
        { id: content.id, params: buildContentParams(params, properties) },
        options,
      );
    } else if (contentType) {
      createContent(
        {
          ...buildContentParams(params, properties),
          contentType: contentType.id,
        },
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
          {Object.entries(properties || {}).map(
            ([propertyKey, property], index) => (
              <ContentItem key={propertyKey}>
                <Controller
                  name={propertyKey}
                  control={control}
                  defaultValue={content?.properties[propertyKey]}
                  rules={validationRules[propertyKey]}
                  render={({ field }) => (
                    <FormControl>
                      <ContentFieldInput
                        contentField={{
                          ...property,
                          name: slugify(property.title),
                        }}
                        field={field}
                        errors={errors}
                        idx={index}
                      />
                    </FormControl>
                  )}
                />
              </ContentItem>
            ),
          )}
        </ContentContainer>
      </form>
    </Wrapper>
  );
};
