/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonSchemaType } from "@/app-components/inputs/JsonSchemaObjectBuilder";

export type ContentField = {
  title: string;
  type: JsonSchemaType<"fieldInput">;
  name: string;
};

export type ContentSchemaProperties = Record<string, ContentField>;
