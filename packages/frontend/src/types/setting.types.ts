/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export interface ISettingSchemaDefinition {
  schema: Record<string, any>;
  scope: "global" | "extension";
  extensionType?: string;
  extensionName?: string;
}

export type ISettingSchemasMap = Record<string, ISettingSchemaDefinition>;
