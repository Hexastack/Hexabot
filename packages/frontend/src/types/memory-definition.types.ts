/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export enum MemoryScope {
  global = "global",
  workflow = "workflow",
  run = "run",
}

export type MemorySchema = Record<string, unknown>;

export interface IMemoryDefinitionAttributes {
  name: string;
  slug: string;
  scope: MemoryScope;
  schema: MemorySchema;
  ttlSeconds?: number | null;
}

export interface IMemoryDefinitionStub
  extends IBaseSchema,
    IMemoryDefinitionAttributes {}

export interface IMemoryDefinition
  extends IMemoryDefinitionStub,
    IFormat<Format.BASIC> {}
