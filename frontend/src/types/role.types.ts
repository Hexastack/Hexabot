/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IPermission } from "./permission.types";
import { IUser } from "./user.types";

export interface IRoleAttributes {
  name: string;
}

export interface IRoleStub
  extends IBaseSchema,
    OmitPopulate<IRoleAttributes, EntityType.ROLE> {
  name: string;
}

export interface IRole extends IRoleStub, IFormat<Format.BASIC> {}

export interface IRoleFull extends IRoleStub, IFormat<Format.FULL> {
  users: IUser[];
  permissions: IPermission[];
}
