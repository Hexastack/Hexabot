/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
