/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
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
  language: string;
}

export interface INlpSampleStub
  extends IBaseSchema,
    OmitPopulate<INlpSampleAttributes, EntityType.NLP_SAMPLE> {}

export interface INlpSample extends INlpSampleStub, IFormat<Format.BASIC> {
  entities: string[];
  language: string;
}

export interface INlpSampleFull extends INlpSampleStub, IFormat<Format.FULL> {
  entities: INlpSampleEntity[];
  language: ILanguage;
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