/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export enum ContentFieldType {
  TEXT = "text",
  URL = "url",
  TEXTAREA = "textarea",
  CHECKBOX = "checkbox",
  FILE = "file",
  HTML = "html",
}

export type ContentField = {
  name: string;
  label: string;
  type: ContentFieldType;
};

export interface IContentTypeAttributes {
  name: string;
  fields?: ContentField[];
}

export interface IContentTypeStub extends IBaseSchema {
  name: string;
  fields?: ContentField[];
}

export interface IContentType extends IContentTypeStub, IFormat<Format.BASIC> {}
