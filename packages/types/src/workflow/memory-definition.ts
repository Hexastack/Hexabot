/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

import { memoryScopeSchema } from "./domain";

const memoryDefinitionObjectSchema = baseStubSchema.extend({
  name: z.string(),
  slug: z.string(),
  scope: memoryScopeSchema,
  schema: z.any(),
  ttlSeconds: z.coerce.number().nullable().optional(),
});

export const memoryDefinitionStubSchema = memoryDefinitionObjectSchema;

export const memoryDefinitionSchema = memoryDefinitionObjectSchema;

export const memoryDefinitionFullSchema = memoryDefinitionObjectSchema;

export type MemoryDefinitionStub = z.infer<typeof memoryDefinitionStubSchema>;

export type MemoryDefinition = z.infer<typeof memoryDefinitionSchema>;

export type MemoryDefinitionFull = z.infer<typeof memoryDefinitionFullSchema>;
