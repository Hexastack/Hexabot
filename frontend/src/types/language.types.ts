/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface ILanguageAttributes {
  title: string;
  code: string;
  isDefault: boolean;
  isRTL: boolean;
}

export interface ILanguageStub
  extends IBaseSchema,
    OmitPopulate<ILanguageAttributes, EntityType.LANGUAGE> {}

export interface ILanguage extends ILanguageStub, IFormat<Format.BASIC> {}
