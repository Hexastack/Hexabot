/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";
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

export interface INlpValueStub extends IBaseSchema, INlpValueAttributes {}
export interface INlpValue extends INlpValueStub, IFormat<Format.BASIC> {}

export interface INlpValueFull
  extends Omit<INlpValueStub, "entity">,
    IFormat<Format.FULL> {
  entity: INlpEntity;
}
