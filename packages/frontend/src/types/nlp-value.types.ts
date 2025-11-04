/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat, TNestedPaths } from "./base.types";
import { INlpEntity, INlpMetadata } from "./nlp-entity.types";

export interface INlpValueAttributes {
  entity: string;
  foreign_id?: string;
  value: string;
  doc?: string;
  expressions?: string[];
  metadata?: INlpMetadata;
  builtin?: boolean;
  nlpSamplesCount?: number;
}

export interface INlpValueFilters
  extends TNestedPaths<{ entity: { id: string } }> {
  value: string;
  doc: string;
}

export interface INlpValueStub extends IBaseSchema, INlpValueAttributes {}
export interface INlpValue extends INlpValueStub, IFormat<Format.BASIC> {}

export interface INlpValueFull
  extends Omit<INlpValueStub, "entity">,
    IFormat<Format.FULL> {
  entity: INlpEntity;
}
