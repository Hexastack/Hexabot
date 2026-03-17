/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Settings } from "@hexabot-ai/agentic";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

import { isRecord } from "@/utils/object";

import {
  extractUiSchema,
  getSchemaPropertyNames,
} from "./schema-defaults.utils";

const getSchemaDescription = (schema?: RJSFSchema) => {
  if (typeof schema?.description !== "string") {
    return undefined;
  }

  const trimmed = schema.description.trim();

  return trimmed.length > 0 ? trimmed : undefined;
};
const addDescriptionsAsHelp = (
  schema?: RJSFSchema,
  uiSchema: UiSchema = {},
): UiSchema => {
  if (!schema) {
    return uiSchema;
  }

  const nextUiSchema: UiSchema = { ...uiSchema };
  const description = getSchemaDescription(schema);

  if (description && nextUiSchema["ui:help"] === undefined) {
    nextUiSchema["ui:help"] = description;
  }

  if (description) {
    const currentUiOptions = isRecord(nextUiSchema["ui:options"])
      ? (nextUiSchema["ui:options"] as Record<string, unknown>)
      : {};

    nextUiSchema["ui:options"] = {
      ...currentUiOptions,
      description: "",
    };
  }

  if (schema.type === "object" && isRecord(schema.properties)) {
    Object.entries(schema.properties).forEach(([propertyName, propertySchema]) => {
      const currentPropertyUi = isRecord(nextUiSchema[propertyName])
        ? (nextUiSchema[propertyName] as UiSchema)
        : {};
      const nextPropertyUi = addDescriptionsAsHelp(
        propertySchema as RJSFSchema,
        currentPropertyUi,
      );

      if (Object.keys(nextPropertyUi).length > 0) {
        nextUiSchema[propertyName] = nextPropertyUi;
      }
    });
  }

  if (schema.type === "array" && schema.items && !Array.isArray(schema.items)) {
    const currentItemsUi = isRecord(nextUiSchema.items)
      ? (nextUiSchema.items as UiSchema)
      : {};
    const nextItemsUi = addDescriptionsAsHelp(
      schema.items as RJSFSchema,
      currentItemsUi,
    );

    if (Object.keys(nextItemsUi).length > 0) {
      nextUiSchema.items = nextItemsUi;
    }
  }

  return nextUiSchema;
};

export const buildSettingsUiSchema = (
  schema?: RJSFSchema,
  formData?: Record<string, unknown>,
): UiSchema | undefined => {
  const properties = getSchemaPropertyNames(schema);

  if (properties.length === 0) {
    return undefined;
  }
  const uiSchema = addDescriptionsAsHelp(schema, extractUiSchema(schema));

  if (properties.includes("retries")) {
    const data = formData?.retries as Settings["retries"] | undefined;

    if (!data?.enabled) {
      const retryProps = getSchemaPropertyNames(
        schema?.properties?.["retries"] as RJSFSchema,
      );
      const currentRetriesUi = isRecord(uiSchema.retries)
        ? (uiSchema.retries as UiSchema)
        : {};

      uiSchema.retries = retryProps
        .filter((p) => p !== "enabled")
        .reduce<UiSchema>((acc, p) => {
          const currentRetryFieldUi = isRecord(acc[p]) ? (acc[p] as UiSchema) : {};

          return {
            ...acc,
            [p]: {
              ...currentRetryFieldUi,
              "ui:disabled": true,
            },
          };
        }, currentRetriesUi);
    }
  }

  return uiSchema;
};
