/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema, UiSchema } from "@rjsf/utils";

import type { ISettingSchemasMap } from "@/types/setting.types";

import { extractUiSchema } from "../visual-editor/v4/utils/schema-defaults.utils";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const getSchemaTitle = (
  group: string,
  schemas: ISettingSchemasMap,
): string | undefined => {
  const rawTitle = (schemas[group]?.schema as RJSFSchema | undefined)?.title;

  if (typeof rawTitle !== "string") {
    return undefined;
  }

  const title = rawTitle.trim();

  return title.length > 0 ? title : undefined;
};

export const resolveSettingsGroupTitle = (
  group: string,
  schemas: ISettingSchemasMap,
  t: TranslateFn,
): string => {
  const schemaTitle = getSchemaTitle(group, schemas);

  if (schemaTitle) {
    return schemaTitle;
  }

  return t(`title.${group}`, {
    ns: group,
    defaultValue: group,
  });
};

export const buildSettingsUiSchema = (schema: RJSFSchema): UiSchema => {
  const extracted = extractUiSchema(schema);
  const order = Object.keys(schema.properties || {});

  return {
    ...extracted,
    // Avoid duplicating the tab title inside each panel.
    "ui:title": "",
    ...(order.length ? { "ui:order": order } : {}),
  };
};
