/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "./fragments";

const languageObjectSchema = baseStubSchema.extend({
  title: z.string(),
  code: z.string(),
  isDefault: z.coerce.boolean(),
  isRTL: z.coerce.boolean(),
});
const translationObjectSchema = baseStubSchema.extend({
  str: z.string(),
  translations: z.record(z.string(), z.string()),
});

export const languageStubSchema = languageObjectSchema;

export const languageSchema = languageObjectSchema;

export const languageFullSchema = languageObjectSchema;

export const translationStubSchema = translationObjectSchema;

export const translationSchema = translationObjectSchema;

export const translationFullSchema = translationObjectSchema;

export type LanguageStub = z.infer<typeof languageStubSchema>;

export type Language = z.infer<typeof languageSchema>;

export type LanguageFull = z.infer<typeof languageFullSchema>;

export type TranslationStub = z.infer<typeof translationStubSchema>;

export type Translation = z.infer<typeof translationSchema>;

export type TranslationFull = z.infer<typeof translationFullSchema>;
