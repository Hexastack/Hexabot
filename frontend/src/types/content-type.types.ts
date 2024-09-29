/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
