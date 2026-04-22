/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { ContentType as SharedContentType } from "@hexabot-ai/types";

import {
  JsonSchemaType,
  SchemaNodeForm,
} from "@/app-components/inputs/JsonSchemaObjectBuilder";

export type ContentField = {
  title: string;
  type: JsonSchemaType<"fieldInput">;
  name: string;
};

export type IContentTypeAttributes = Pick<SharedContentType, "name"> & {
  schema: SchemaNodeForm;
};

export type ContentSchemaProperties = Record<string, ContentField>;
