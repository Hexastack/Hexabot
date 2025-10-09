/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IAttachment } from "./attachment.types";
import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { IRole } from "./role.types";

export interface IUserAttributes {
  first_name: string;
  last_name: string;
  email: string;
  language: string;
  password?: string;
  state: boolean;
  roles: string[];
  avatar: string | null;
}

export interface IUserStub
  extends IBaseSchema,
    OmitPopulate<IUserAttributes, EntityType.USER> {}

export interface IProfileAttributes extends Partial<IUserStub> {
  password2?: string;
  avatar?: File | null;
}

export interface IUser extends IUserStub, IFormat<Format.BASIC> {
  roles: string[]; //populated by default
  avatar: string | null;
}

export interface IUserFull extends IUserStub, IFormat<Format.FULL> {
  roles: IRole[];
  avatar: IAttachment | null;
}
