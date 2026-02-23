/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export interface ICredentialAttributes {
  name: string;
  value: string;
  owner: string | null;
}

export interface ICredentialStub
  extends IBaseSchema,
    OmitPopulate<ICredentialAttributes, EntityType.CREDENTIAL> {}

export interface ICredential extends ICredentialStub, IFormat<Format.BASIC> {}
