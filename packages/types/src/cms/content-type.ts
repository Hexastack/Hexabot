/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

const contentTypeObjectSchema = baseStubSchema.extend({
  name: z.string(),
  schema: z.any(),
});

export const contentTypeStubSchema = contentTypeObjectSchema;

export const contentTypeSchema = contentTypeObjectSchema;

export const contentTypeFullSchema = contentTypeObjectSchema;

export type ContentTypeStub = z.infer<typeof contentTypeStubSchema>;

export type ContentType = z.infer<typeof contentTypeSchema>;

export type ContentTypeFull = z.infer<typeof contentTypeFullSchema>;
