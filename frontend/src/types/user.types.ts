/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
