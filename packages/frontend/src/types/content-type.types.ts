/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JsonSchemaType,
  SchemaNodeForm,
} from "@/app-components/inputs/JsonSchemaObjectBuilder";
import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export type ContentField = {
  title: string;
  type: JsonSchemaType<"fieldInput">;
  name: string;
};

export interface IContentTypeAttributes {
  name: string;
  schema: SchemaNodeForm;
}

export type ContentSchemaProperties = Record<string, ContentField>;
export interface IContentTypeStub extends IBaseSchema {
  name: string;
  schema: SchemaNodeForm;
}

export interface IContentType extends IContentTypeStub, IFormat<Format.BASIC> {}
