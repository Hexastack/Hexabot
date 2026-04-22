/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { contentTypeSchema } from "./content-type";

const contentAliasMap = {
  contentTypeId: "contentType",
} as const;
const contentStubObjectSchema = baseStubSchema.extend({
  title: z.string(),
  status: z.coerce.boolean(),
  properties: preprocess(
    (value) => (value == null ? null : value),
    z.record(z.string(), z.unknown()).nullable(),
  ),
  searchText: z.string(),
});

export const contentStubSchema = contentStubObjectSchema;

export const contentSchema = preprocess(
  (value) => withAliases(value, contentAliasMap),
  contentStubObjectSchema.extend({
    contentType: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const contentFullSchema = preprocess(
  (value) => withAliases(value, contentAliasMap),
  contentStubObjectSchema.extend({
    contentType: contentTypeSchema,
  }),
);

export type ContentStub = z.infer<typeof contentStubSchema>;

export type Content = z.infer<typeof contentSchema>;

export type ContentFull = z.infer<typeof contentFullSchema>;
