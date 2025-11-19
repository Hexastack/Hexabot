/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export enum MenuType {
  web_url = "web_url",
  postback = "postback",
  nested = "nested",
}

export interface IMenuNodeAttributes {
  type: MenuType;
  url?: string;
  title: string;
  payload?: string;
  parent?: string;
}

export interface IMenuNodeStub extends IBaseSchema, IMenuNodeAttributes {}

export interface IMenuNode extends IMenuNodeStub, IFormat<Format.BASIC> {
  call_to_actions?: string[];
}

export interface IMenuNodeFull extends IMenuNodeStub, IFormat<Format.BASIC> {
  call_to_actions?: IMenuNode[];
}
