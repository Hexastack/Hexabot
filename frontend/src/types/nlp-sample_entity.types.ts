/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { INlpEntity } from "./nlp-entity.types";
import { INlpSample } from "./nlp-sample.types";
import { INlpValue } from "./nlp-value.types";

export interface INlpSampleEntityAttributes {
  entity: string;
  value: string;
  sample: string;
  start?: number;
  end?: number;
}

export interface INlpSampleEntityStub
  extends IBaseSchema,
    OmitPopulate<INlpSampleEntityAttributes, EntityType.NLP_SAMPLE_ENTITY> {}

export interface INlpSampleEntity
  extends INlpSampleEntityStub,
    IFormat<Format.BASIC> {
  entity: string;
  value: string;
  sample: string;
}

export interface INlpSampleEntityFull
  extends INlpSampleEntityStub,
    IFormat<Format.FULL> {
  entity: INlpEntity;
  value: INlpValue;
  sample: INlpSample;
}
