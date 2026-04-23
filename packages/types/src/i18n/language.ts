/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";

const languageObjectSchema = baseStubSchema.extend({
  title: z.string(),
  code: z.string(),
  isDefault: z.coerce.boolean(),
  isRTL: z.coerce.boolean(),
});

export const languageStubSchema = languageObjectSchema;

export const languageSchema = languageObjectSchema;

export const languageFullSchema = languageObjectSchema;

export type LanguageStub = z.infer<typeof languageStubSchema>;

export type Language = z.infer<typeof languageSchema>;

export type LanguageFull = z.infer<typeof languageFullSchema>;
