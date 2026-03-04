/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { FC, Fragment, useEffect, useMemo, useState } from "react";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
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
import { IContent } from "@/types/content.types";

type ContentFormData = Record<string, unknown> & {
  contentType: string;
  status: boolean;
  title: string;
};

const buildDefaultFormData = (
  content: IContent | null | undefined,
  contentTypeId: string,
): ContentFormData => ({
  contentType: content?.contentType ?? contentTypeId,
  status: content?.status ?? false,
  title: content?.title ?? "",
  ...(content?.properties ?? {}),
});
const buildContentParams = (
  params: ContentFormData,
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
const getContentSchema = (schema: unknown) => {
  if (!schema || typeof schema !== "object") {
    return {
      properties: {} as ContentSchemaProperties,
      required: [] as string[],
    };
  }

  const typedSchema = schema as Record<string, unknown>;
  const required = Array.isArray(typedSchema.required)
    ? typedSchema.required.filter(
        (fieldName): fieldName is string => typeof fieldName === "string",
      )
    : [];

  return {
    properties: (typedSchema.properties ?? {}) as ContentSchemaProperties,
    required,
  };
};
const getRequiredFields = (
  properties: ContentSchemaProperties,
  required: string[],
) => (properties.title && !required.includes("title") ? [...required, "title"] : required);
const buildStringFieldSchema = (title: string): RJSFSchema => ({
  type: "string",
  title,
});
const buildFileFieldSchema = (title: string): RJSFSchema => ({
  type: "object",
  title,
  properties: {
    type: { type: "string" },
    payload: {
      type: "object",
      properties: {
        id: {
          anyOf: [{ type: "string" }, { type: "null" }],
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
});
const CONTENT_FIELD_SCHEMA_FACTORIES: Partial<
  Record<ContentField["type"], (title: string) => RJSFSchema>
> = {
  boolean: (title) => ({ type: "boolean", title }),
  textarea: buildStringFieldSchema,
  uri: (title) => ({ type: "string", format: "uri", title }),
  file: buildFileFieldSchema,
  html: buildStringFieldSchema,
  string: buildStringFieldSchema,
};
const REQUIRED_NON_EMPTY_FIELD_TYPES = new Set<ContentField["type"]>([
  "string",
  "textarea",
  "html",
  "uri",
]);
const CONTENT_FIELD_UI_SCHEMAS: Partial<
  Record<ContentField["type"], UiSchema>
> = {
  textarea: {
    "ui:widget": "textarea",
    "ui:options": {
      rows: 5,
    },
  },
  file: {
    "ui:field": "ActionAttachmentField",
    "ui:options": {
      wrapInAttachmentKey: false,
      resourceRef: AttachmentResourceRef.ContentAttachment,
    },
  },
};

export const ContentForm: FC<ComponentFormProps<IContent, IContentType>> = ({
  data: { defaultValues: content, presetValues: contentType },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const { properties, required } = getContentSchema(contentType?.schema);
  const requiredFields = getRequiredFields(properties, required);
  const hasRequiredFields = requiredFields.length > 0;
  const contentTypeId = content?.contentType ?? contentType?.id ?? "";
  const defaultFormData = useMemo(
    () => buildDefaultFormData(content, contentTypeId),
    [content, contentTypeId],
  );
  const [formData, setFormData] = useState<ContentFormData>(defaultFormData);
  const [hasVisibleErrors, setHasVisibleErrors] = useState(hasRequiredFields);
  const { schema, uiSchema } = useMemo(() => {
    const schemaProperties: Record<string, RJSFSchema> = {
      contentType: { type: "string", title: "contentType" },
    };
    const nextUiSchema: UiSchema = {
      contentType: {
        "ui:widget": "hidden",
      },
    };

    for (const [propertyKey, property] of Object.entries(properties)) {
      const fieldTitle = property.title || propertyKey;
      const translatedLabel = t(`label.${fieldTitle}`, {
        defaultValue: fieldTitle,
      });
      const schemaFactory =
        CONTENT_FIELD_SCHEMA_FACTORIES[property.type] ?? buildStringFieldSchema;
      const isRequiredField = requiredFields.includes(propertyKey);
      const baseFieldSchema =
        property.type === "uri" && !isRequiredField
          ? buildStringFieldSchema(translatedLabel)
          : schemaFactory(translatedLabel);

      schemaProperties[propertyKey] =
        isRequiredField && REQUIRED_NON_EMPTY_FIELD_TYPES.has(property.type)
          ? {
              ...baseFieldSchema,
              minLength:
                typeof baseFieldSchema.minLength === "number"
                  ? Math.max(1, baseFieldSchema.minLength)
                  : 1,
            }
          : baseFieldSchema;

      const fieldUiSchema = CONTENT_FIELD_UI_SCHEMAS[property.type];

      if (fieldUiSchema) {
        nextUiSchema[propertyKey] = fieldUiSchema;
      }
    }

    return {
      schema: {
        type: "object",
        properties: schemaProperties,
        required: requiredFields,
      } as RJSFSchema,
      uiSchema: nextUiSchema,
    };
  }, [properties, requiredFields, t]);
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
  const onSubmitForm = () => {
    if (hasVisibleErrors) {
      return;
    }

    if (content) {
      updateContent(
        { id: content.id, params: buildContentParams(formData, properties) },
        options,
      );
    } else if (contentType) {
      createContent(
        {
          ...buildContentParams(formData, properties),
          contentType: contentType.id,
        },
        options,
      );
    } else {
      throw new Error("Content Type must be passed to the dialog form.");
    }
  };

  useEffect(() => {
    setFormData(defaultFormData);
    setHasVisibleErrors(hasRequiredFields);
  }, [defaultFormData, hasRequiredFields]);

  return (
    <Wrapper
      onSubmit={onSubmitForm}
      {...WrapperProps}
      confirmButtonProps={{
        ...WrapperProps?.confirmButtonProps,
        disabled:
          hasVisibleErrors ||
          Boolean(WrapperProps?.confirmButtonProps?.disabled),
      }}
    >
      <JsonSchemaForm
        schema={schema}
        formData={formData}
        onFormDataChange={(nextFormData) =>
          setFormData(nextFormData as ContentFormData)
        }
        onVisibleErrorsChange={setHasVisibleErrors}
        validateOnMount
        uiSchema={uiSchema}
        enableJsonataTextWidget={false}
        idPrefix={content ? `content-${content.id}` : "content-new"}
      />
    </Wrapper>
  );
};
