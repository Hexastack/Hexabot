/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValue } from "@hexabot-ai/agentic";
import { getDefaultFormState, RJSFSchema } from "@rjsf/utils";
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
