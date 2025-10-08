/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { INlpValue } from "./nlp-value.types";

export enum LookupStrategy {
  keywords = "keywords",
  trait = "trait",
  // free_text = "free-text",
  pattern = "pattern",
}

export type Lookup = `${LookupStrategy}`;

export interface INlpMetadata {
  // Required when lookups is "pattern"
  pattern?: string;
  wordBoundary?: boolean;
  removeSpaces?: boolean;
  toLowerCase?: boolean;
  stripDiacritics?: boolean;
}

export interface INlpEntityAttributes {
  foreign_id?: string;
  name: string;
  lookups: Lookup[];
  doc?: string;
  builtin?: boolean;
  weight?: number;
}

export interface INlpEntityStub
  extends IBaseSchema,
    OmitPopulate<INlpEntityAttributes, EntityType.NLP_ENTITY> {}

export interface INlpEntity extends INlpEntityStub, IFormat<Format.BASIC> {
  values: string[];
}

export interface INlpEntityFull extends INlpEntityStub, IFormat<Format.FULL> {
  values: INlpValue[];
}

export interface INlpEntityFilters extends INlpEntity {}
