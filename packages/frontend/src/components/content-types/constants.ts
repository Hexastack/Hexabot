/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PropertyEntryForm } from "@/app-components/inputs/JsonSchemaObjectBuilder";

export const CONTENT_TYPE_DEFAULT_PROPERTIES = [
  { key: "title", schema: { type: "string", title: "Title" } },
  { key: "status", schema: { type: "boolean", title: "Status" } },
] satisfies PropertyEntryForm[];
