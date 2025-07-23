/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
