/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema } from "@rjsf/utils";

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export interface ISettingAttributes {
  group: string;
  subgroup?: string;
  label: string;
  schema: RJSFSchema;
  value: unknown;
  options?: string[];
  config?: Record<string, unknown>;
  weight?: number;
  translatable?: boolean;
}

export interface ISettingStub extends IBaseSchema, ISettingAttributes {}

export interface ISetting extends ISettingStub, IFormat<Format.BASIC> {}

export interface ISettingCatalogGroup {
  group: string;
  schema: RJSFSchema;
  values: Record<string, unknown>;
}
