/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
