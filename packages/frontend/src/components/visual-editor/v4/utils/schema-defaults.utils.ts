/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValue } from "@hexabot-ai/agentic";
import { getDefaultFormState, RJSFSchema, UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";
import { JSONSchema } from "monaco-yaml";

import validator from "@/utils/rjsf-zod-validator";

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

export const getSchemaProperties = <T extends SchemaProperties>(
  schema?: RJSFSchema,
): T | undefined => {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return undefined;
  }

  const properties = schema.properties as T;

  return Object.keys(properties).length > 0 ? properties : undefined;
};

export const getSchemaPropertyNames = (schema?: RJSFSchema): string[] => {
  return Object.keys(getSchemaProperties(schema) ?? {});
};

const UI_KEYS = [
  "ui:widget",
  "ui:field",
  "ui:options",
  "ui:placeholder",
  "ui:help",
] as const;

export const extractUiSchema = (
  jsonSchema?: RJSFSchema | JSONSchema7,
): UiSchema => {
  const ui: UiSchema = {};

  for (const k of UI_KEYS) {
    if (jsonSchema?.[k] !== undefined) ui[k] = jsonSchema[k];
  }

  if (jsonSchema?.type === "object" && jsonSchema?.properties) {
    for (const [propName, propSchema] of Object.entries(
      jsonSchema.properties,
    )) {
      const childUi = extractUiSchema(propSchema as RJSFSchema);

      if (Object.keys(childUi).length) ui[propName] = childUi;
    }
  }

  if (jsonSchema?.type === "array" && jsonSchema?.items) {
    const itemsUi = extractUiSchema(jsonSchema.items as JSONSchema7);

    if (Object.keys(itemsUi).length) ui.items = itemsUi;
  }

  return ui;
};
