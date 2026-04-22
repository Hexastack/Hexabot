/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AttachmentResourceRef,
  type Content,
  type ContentType,
} from "@hexabot-ai/types";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import { FC, Fragment, useEffect, useMemo, useState } from "react";

import { JsonSchemaForm } from "@/app-components/inputs/JsonSchemaForm";
import { useCreate } from "@/hooks/crud/useCreate";
import { useUpdate } from "@/hooks/crud/useUpdate";
import { useToast } from "@/hooks/useToast";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType } from "@/services/types";
import { ComponentFormProps } from "@/types/common/dialogs.types";
import {
  ContentField,
  ContentSchemaProperties,
} from "@/types/content-type.types";

import { getSchemaProperties } from "../visual-editor/v4/utils/schema-defaults.utils";

type ContentFormData = Record<string, unknown> & {
  contentType: string;
  status: boolean;
  title: string;
};

const buildDefaultFormData = (
  content: Content | null | undefined,
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
  const writableProperties = Object.fromEntries(
    Object.keys(properties)
      .filter((key) => !["status", "title"].includes(key))
      .map((key) => [key, params[key]]),
  );

  return {
    title: params.title,
    contentType: params.contentType,
    status: params.status,
    properties: writableProperties,
  };
};
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

export const ContentForm: FC<ComponentFormProps<Content, ContentType>> = ({
  data: { defaultValues: content, presetValues: contentType },
  Wrapper = Fragment,
  WrapperProps,
  ...rest
}) => {
  const { t } = useTranslate();
  const { toast } = useToast();
  const properties = getSchemaProperties<ContentSchemaProperties>(
    contentType?.schema as RJSFSchema,
  );
  const contentTypeId = content?.contentType ?? contentType?.id ?? "";
  const defaultFormData = useMemo(
    () => buildDefaultFormData(content, contentTypeId),
    [content, contentTypeId],
  );
  const [formData, setFormData] = useState<ContentFormData>(defaultFormData);
  const [hasVisibleErrors, setHasVisibleErrors] = useState(false);
  const { schema, uiSchema } = useMemo(() => {
    const schemaProperties: Record<string, RJSFSchema> = {
      contentType: { type: "string", title: "contentType" },
    };
    const nextUiSchema: UiSchema = {
      contentType: {
        "ui:widget": "hidden",
      },
    };

    for (const [propertyKey, property] of Object.entries(properties || {})) {
      const fieldTitle = property.title || propertyKey;
      const translatedLabel = t(`label.${fieldTitle}`, {
        defaultValue: fieldTitle,
      });
      const schemaFactory =
        CONTENT_FIELD_SCHEMA_FACTORIES[property.type] ?? buildStringFieldSchema;
      const baseFieldSchema = schemaFactory(translatedLabel);

      schemaProperties[propertyKey] = REQUIRED_NON_EMPTY_FIELD_TYPES.has(
        property.type,
      )
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
        required: contentType?.schema?.["required"] || [],
      } as RJSFSchema,
      uiSchema: nextUiSchema,
    };
  }, [properties, t]);
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
  }, [defaultFormData]);

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
