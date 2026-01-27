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

    return defaults as T;
  } catch {
    return undefined;
  }
};