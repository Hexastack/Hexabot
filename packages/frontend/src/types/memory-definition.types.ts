/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  MemoryScope,
  type MemoryDefinition as SharedMemoryDefinition,
} from "@hexabot-ai/types";

export { MemoryScope };

export type MemorySchema = Record<string, unknown>;

export type IMemoryDefinitionAttributes = Pick<
  SharedMemoryDefinition,
  "name" | "slug" | "scope" | "schema" | "ttlSeconds"
>;
