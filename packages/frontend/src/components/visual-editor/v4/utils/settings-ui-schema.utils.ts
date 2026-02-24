/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema, UiSchema } from "@rjsf/utils";

import {
  extractUiSchema,
  getSchemaPropertyNames,
} from "./schema-defaults.utils";

const COMMON_SETTING_KEYS = ["timeout_ms", "retries"] as const;
const RETRY_DETAIL_KEYS = [
  "max_attempts",
  "backoff_ms",
  "max_delay_ms",
  "jitter",
  "multiplier",
] as const;
const RETRIES_ANIMATED_VISIBILITY = {
  controllerField: "enabled",
  detailFields: [...RETRY_DETAIL_KEYS],
  expandedValue: true,
  transitionMs: 240,
} as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const normalizeSettingsFormData = <T extends Record<string, unknown>>(
  formData: T,
): T => {
  const retries = formData.retries;

  if (!isRecord(retries) || typeof retries.enabled === "boolean") {
    return formData;
  }

  const hasLegacyRetryValues = RETRY_DETAIL_KEYS.some(
    (key) => retries[key] !== undefined,
  );

  if (!hasLegacyRetryValues) {
    return formData;
  }

  return {
    ...formData,
    retries: {
      ...retries,
      enabled: true,
    },
  };
};

export const buildSettingsUiSchema = (
  schema?: RJSFSchema,
  retriesExpandedByDefault = false,
  _formData?: Record<string, unknown>,
): UiSchema | undefined => {
  const properties = getSchemaPropertyNames(schema);

  if (properties.length === 0) {
    return undefined;
  }

  const commonSet = new Set<string>(COMMON_SETTING_KEYS);
  const actionSpecific = properties.filter((key) => !commonSet.has(key));
  const commonOrdered = COMMON_SETTING_KEYS.filter((key) =>
    properties.includes(key),
  );
  const uiSchema: UiSchema = {
    ...extractUiSchema(schema),
    "ui:order": [...actionSpecific, ...commonOrdered, "*"],
  };

  if (properties.includes("retries")) {
    const retriesUiSchema: UiSchema = {
      "ui:options": {
        collapsible: true,
        defaultExpanded: retriesExpandedByDefault,
        animatedVisibility: RETRIES_ANIMATED_VISIBILITY,
      },
      "ui:order": ["enabled", ...RETRY_DETAIL_KEYS, "*"],
    };

    uiSchema.retries = retriesUiSchema;
  }

  return uiSchema;
};
