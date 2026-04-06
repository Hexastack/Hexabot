/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export interface ISettingAttributes {
  group: string;
  subgroup?: string;
  label: string;
  value: unknown;
}

export interface ISettingStub extends IBaseSchema, ISettingAttributes {}

export interface ISetting extends ISettingStub, IFormat<Format.BASIC> {}

export interface ISettingSchemaDefinition {
  schema: Record<string, any>;
  scope: "global" | "extension";
  extensionType?: string;
  extensionName?: string;
}

export type ISettingSchemasMap = Record<string, ISettingSchemaDefinition>;
