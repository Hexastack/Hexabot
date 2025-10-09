/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";

export enum MenuType {
  web_url = "web_url",
  postback = "postback",
  nested = "nested",
}

export interface IMenuItemAttributes {
  type: MenuType;
  url?: string;
  title: string;
  payload?: string;
  parent?: string;
}

export interface IMenuItemStub
  extends IBaseSchema,
    OmitPopulate<IMenuItemAttributes, EntityType.MENU> {}

export interface IMenuItem extends IMenuItemStub, IFormat<Format.BASIC> {
  parent?: string;
}

export interface IMenuItemFull extends IMenuItemStub, IFormat<Format.FULL> {
  parent?: IMenuItem[];
}
