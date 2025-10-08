/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";
import { IContentType } from "./content-type.types";

export interface IContentAttributes {
  entity: string;
  title: string;
  status: boolean;
  dynamicFields: Record<string, any>;
}

export interface IContentStub extends IBaseSchema {
  title: string;
  status: boolean;
  dynamicFields: Record<string, any>;
}

export interface IContent extends IContentStub, IFormat<Format.BASIC> {
  entity: string;
}

export interface IContentFull extends IContentStub, IFormat<Format.FULL> {
  entity: IContentType;
}
