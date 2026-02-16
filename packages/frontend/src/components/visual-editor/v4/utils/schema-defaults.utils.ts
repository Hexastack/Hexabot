/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValue } from "@hexabot-ai/agentic";
import { getDefaultFormState, RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { JSONSchema } from "monaco-yaml";

export const getSchemaDefaults = <T extends Record<string, JsonValue>>(
  schema: JSONSchema,
): T | undefined => {
  try {
    const defaults = getDefaultFormState<T>(
      validator,
      schema as RJSFSchema,
      undefined,
      schema as RJSFSchema,
      false,
      {
        emptyObjectFields: "skipEmptyDefaults",
      },
    );

    return normalizeDefaults(defaults) as T;
  } catch {
    return undefined;
  }
};

const normalizeDefaults = (
  value: JsonValue | undefined,
): JsonValue | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const next = value
      .map((item) => normalizeDefaults(item))
      .filter((item): item is JsonValue => item !== undefined);

    return next.length > 0 ? next : undefined;
  }

  if (value && typeof value === "object") {
    const next: Record<string, JsonValue> = {};

    Object.entries(value).forEach(([key, entry]) => {
      const normalized = normalizeDefaults(entry as JsonValue | undefined);

      if (normalized !== undefined) {
        next[key] = normalized;
      }
    });

    return next;
  }

  return value;
};

type SchemaProperties = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const getSchemaProperties = (
  schema?: RJSFSchema,
): SchemaProperties | undefined => {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return undefined;
  }

  const properties = schema.properties as SchemaProperties;

  return Object.keys(properties).length > 0 ? properties : undefined;
};

export const getSchemaPropertyNames = (schema?: RJSFSchema): string[] => {
  return Object.keys(getSchemaProperties(schema) ?? {});
};

export const buildUiSchemaFromPropertyUiFields = (
  schema: RJSFSchema | undefined,
  propertyNames: string[],
): UiSchema | undefined => {
  if (propertyNames.length === 0) {
    return undefined;
  }

  const properties = getSchemaProperties(schema);

  if (!properties) {
    return undefined;
  }

  const uiSchema: UiSchema = {};

  propertyNames.forEach((propertyName) => {
    const propertySchema = properties[propertyName];

    if (!isRecord(propertySchema)) {
      return;
    }

    const uiField = propertySchema.uiField;

    if (typeof uiField === "string" && uiField.length > 0) {
      uiSchema[propertyName] = {
        "ui:field": uiField,
      };
    }
  });

  return Object.keys(uiSchema).length > 0 ? uiSchema : undefined;
};

export const buildUiSchemaFromSchemaUiFields = (
  schema: RJSFSchema | undefined,
): UiSchema | undefined => {
  return buildUiSchemaFromPropertyUiFields(schema, getSchemaPropertyNames(schema));
};
