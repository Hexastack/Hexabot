/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 as JsonSchema } from 'json-schema';
import { z } from 'zod';

/**
 * Convert a Zod schema to a Draft-07 JSON schema.
 */
export const toDraft07JsonSchema = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
): JsonSchema => {
  return schema.toJSONSchema({ target: 'draft-07' }) as JsonSchema;
};
