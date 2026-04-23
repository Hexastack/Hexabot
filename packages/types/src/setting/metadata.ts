/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

const metadataObjectSchema = baseStubSchema.extend({
  name: z.string(),
  value: z.any(),
});

export const metadataStubSchema = metadataObjectSchema;

export const metadataSchema = metadataObjectSchema;

export const metadataFullSchema = metadataObjectSchema;

export type MetadataStub = z.infer<typeof metadataStubSchema>;

export type Metadata = z.infer<typeof metadataSchema>;

export type MetadataFull = z.infer<typeof metadataFullSchema>;
