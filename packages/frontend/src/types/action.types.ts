/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IconName } from "lucide-react/dynamic";
import { JSONSchema } from "monaco-yaml";

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface IActionAttributes {
  name: string;
  icon?: IconName;
  color?: string;
  description: string;
  inputSchema: JSONSchema;
  settingSchema: JSONSchema;
  outputSchema: JSONSchema;
}

export interface IActionStub
  extends IBaseSchema,
    OmitPopulate<IActionAttributes, EntityType.WORKFLOW_ACTIONS> {}

export interface IAction extends IActionStub, IFormat<Format.BASIC> {}
