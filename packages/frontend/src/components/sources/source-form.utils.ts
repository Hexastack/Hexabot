/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type Source, type SourceFull } from "@hexabot-ai/types";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";

import { extractUiSchema } from "@/components/visual-editor/v4/utils/schema-defaults.utils";
import { isRecord } from "@/utils/object";

type SourceLike = Source | SourceFull;

export const EMPTY_SOURCE_SETTINGS_SCHEMA: RJSFSchema = {
  type: "object",
  properties: {},
} as const;

const normalizeSourceSettings = (
  settings: unknown,
): Record<string, unknown> => {
  return isRecord(settings) ? settings : {};
};

export const resolveSourceChannel = (
  source: Pick<SourceLike, "channel"> | null | undefined,
  presetChannel?: string,
) => source?.channel ?? presetChannel ?? "";

export const resolveSourceSettingsSchema = (schema: unknown): RJSFSchema => {
  if (!isRecord(schema)) {
    return EMPTY_SOURCE_SETTINGS_SCHEMA;
  }

  const properties = isRecord(schema.properties)
    ? (schema.properties as RJSFSchema["properties"])
    : {};

  return {
    ...(schema as RJSFSchema),
    type: "object",
    properties,
  };
};

export const buildSourceSettingsUiSchema = (schema: RJSFSchema): UiSchema => {
  const extracted = extractUiSchema(schema);
  const order = Object.keys(schema.properties || {});

  return {
    ...extracted,
    "ui:title": "",
    ...(order.length ? { "ui:order": order } : {}),
  };
};

export const resolveDefaultWorkflowId = (
  value: SourceLike["defaultWorkflow"] | null | undefined,
): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  if (isRecord(value) && typeof value.id === "string") {
    const normalized = value.id.trim();

    return normalized.length > 0 ? normalized : null;
  }

  return null;
};

export const getSourceFormDefaults = (
  source: SourceLike | null | undefined,
): {
  name: string;
  state: boolean;
  settings: Record<string, unknown>;
  defaultWorkflow: string | null;
} => ({
  name: source?.name ?? "",
  state: source?.state ?? true,
  settings: normalizeSourceSettings(source?.settings),
  defaultWorkflow: resolveDefaultWorkflowId(source?.defaultWorkflow),
});

export const buildSourcePayload = ({
  channel,
  name,
  state,
  settings,
  defaultWorkflow,
}: {
  channel: string;
  name: string;
  state: boolean;
  settings: Record<string, unknown>;
  defaultWorkflow: SourceLike["defaultWorkflow"] | null | undefined;
}) => ({
  channel,
  name: name.trim(),
  state,
  settings: normalizeSourceSettings(settings),
  defaultWorkflow: resolveDefaultWorkflowId(defaultWorkflow),
});
