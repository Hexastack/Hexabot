/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat, TNestedPaths } from "./base.types";
import { IContentType } from "./content-type.types";

export interface IContentAttributes {
  contentType: string;
  title: string;
  status: boolean;
  dynamicFields: Record<string, any>;
}

export interface IContentFilters
  extends TNestedPaths<{ contentType: { id: string } }> {
  title: string;
}

export interface IContentStub extends IBaseSchema {
  title: string;
  status: boolean;
  dynamicFields: Record<string, any>;
}

export interface IContent extends IContentStub, IFormat<Format.BASIC> {
  contentType: string;
}

export interface IContentFull extends IContentStub, IFormat<Format.FULL> {
  contentType: IContentType;
}
