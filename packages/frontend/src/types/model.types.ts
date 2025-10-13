/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IPermission } from "./permission.types";

export type TRelation = "role" | "createdBy";

export interface IModelAttributes {
  name: string;
  identity: string;
  attributes: object;
  relation: TRelation;
}

export interface IModelStub
  extends IBaseSchema,
    OmitPopulate<IModelAttributes, EntityType.MODEL> {}

export interface IModel extends IModelStub, IFormat<Format.BASIC> {
  permissions: string[]; //populated by default
}

export interface IModelFull extends IModelStub, IFormat<Format.FULL> {
  permissions: IPermission[];
}
