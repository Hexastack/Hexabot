/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

const translationObjectSchema = baseStubSchema.extend({
  str: z.string(),
  translations: z.record(z.string(), z.string()),
});

export const translationStubSchema = translationObjectSchema;

export const translationSchema = translationObjectSchema;

export const translationFullSchema = translationObjectSchema;

export type TranslationStub = z.infer<typeof translationStubSchema>;

export type Translation = z.infer<typeof translationSchema>;

export type TranslationFull = z.infer<typeof translationFullSchema>;
