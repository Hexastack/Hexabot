/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { ILabelGroup } from "./label-group.types";
import { IUser } from "./user.types";

export interface ILabelAttributes {
  title: string;
  name: string;
  description: string;
  builtin?: boolean;
  group?: string | null;
}

export interface ILabelStub
  extends IBaseSchema,
    OmitPopulate<ILabelAttributes, EntityType.LABEL> {
  subscriber_count: number;
}

export interface ILabel extends ILabelStub, IFormat<Format.BASIC> {
  group?: string | null;
}

export interface ILabelFull extends ILabelStub, IFormat<Format.FULL> {
  users: IUser[];
  group: ILabelGroup;
}
