/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { NlpPattern } from "./block.types";
import { ILanguage } from "./language.types";
import { INlpSampleEntity } from "./nlp-sample_entity.types";

export enum NlpSampleType {
  train = "train",
  test = "test",
  inbox = "inbox",
}

export interface INlpSampleAttributes {
  text: string;
  trained?: boolean;
  type?: NlpSampleType;
  entities: string[];
  language: string | null;
}

export interface INlpSampleStub
  extends IBaseSchema,
    OmitPopulate<INlpSampleAttributes, EntityType.NLP_SAMPLE> {}

export interface INlpSample extends INlpSampleStub, IFormat<Format.BASIC> {
  entities: string[];
  language: string | null;
}

export interface INlpSampleFull extends INlpSampleStub, IFormat<Format.FULL> {
  entities: INlpSampleEntity[];
  language: ILanguage | null;
}

// Dataset Trainer
export interface INlpDatasetTraitEntity {
  entity: string; // entity name
  value: string; // value name
  confidence?: number;
}

export interface INlpDatasetKeywordEntity extends INlpDatasetTraitEntity {
  start: number;
  end: number;
}

export interface INlpDatasetPatternEntity extends INlpDatasetKeywordEntity {}

export interface INlpSampleFormAttributes
  extends Omit<INlpSampleAttributes, "entities"> {
  traitEntities: INlpDatasetTraitEntity[];
  keywordEntities: INlpDatasetKeywordEntity[];
}

export interface INlpDatasetSampleAttributes
  extends Omit<INlpSampleAttributes, "entities"> {
  entities: (INlpDatasetTraitEntity | INlpDatasetKeywordEntity)[];
}

export interface INlpDatasetSample
  extends IBaseSchema,
    INlpDatasetSampleAttributes {}

export interface INlpSampleFilters extends INlpSample {
  patterns?: NlpPattern[];
}
