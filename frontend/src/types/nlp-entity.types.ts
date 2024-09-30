/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { INlpValue } from "./nlp-value.types";

export type Lookup = "keywords" | "trait" | "free-text";

export interface INlpEntityAttributes {
  foreign_id?: string;
  name: string;
  lookups: Lookup[];
  doc?: string;
  builtin?: boolean;
}

export enum NlpLookups {
  keywords = "keywords",
  trait = "trait",
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
