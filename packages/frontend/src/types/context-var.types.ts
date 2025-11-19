/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface IContextVarAttributes {
  name: string;
  label: string;
  permanent: boolean;
}

export interface IContextVarStub
  extends IBaseSchema,
    OmitPopulate<IContextVarAttributes, EntityType.CONTEXT_VAR> {}

export interface IContextVar extends IContextVarStub, IFormat<Format.BASIC> {}

export interface IContextVarFull
  extends IContextVarStub,
    IFormat<Format.FULL> {}
