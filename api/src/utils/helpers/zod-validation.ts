/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ParseParams, ZodArray, ZodSchema } from 'zod';

export const buildZodSchemaValidator =
  <T>(schema: ZodSchema<T> | ZodArray<any>, params?: Partial<ParseParams>) =>
  (data: unknown) =>
    schema.safeParse(data, params).success;
