/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export type ITranslations = Record<string, string>;

export interface ITranslationAttributes {
  str: string;
  translations: ITranslations;
  translated: number;
}

export interface ITranslationStub
  extends IBaseSchema,
    OmitPopulate<ITranslationAttributes, EntityType.TRANSLATION> {}

export interface ITranslation extends ITranslationStub, IFormat<Format.BASIC> {}
