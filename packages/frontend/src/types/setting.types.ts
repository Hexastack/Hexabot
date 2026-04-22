/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Setting as SharedSetting,
  SettingStub as SharedSettingStub,
} from "@hexabot-ai/types";

export type ISettingAttributes = Pick<
  SharedSetting,
  "group" | "subgroup" | "label"
> & {
  subgroup?: string;
  value: string | number | boolean | string[] | Record<string, unknown> | null;
};

export type ISettingStub = SharedSettingStub;

export type Setting = SharedSetting;

export interface ISettingSchemaDefinition {
  schema: Record<string, any>;
  scope: "global" | "extension";
  extensionType?: string;
  extensionName?: string;
}

export type ISettingSchemasMap = Record<string, ISettingSchemaDefinition>;
