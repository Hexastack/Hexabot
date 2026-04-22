/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, baseStubSchema, preprocess, withAliases } from "./fragments";
import { MenuType, menuTypeSchema } from "./primitives";

const contentTypeObjectSchema = baseStubSchema.extend({
  name: z.string(),
  schema: z.any(),
});
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
const menuAliasMap = {
  parentId: "parent",
} as const;
const menuStubObjectSchema = baseStubSchema.extend({
  title: z.string(),
  type: menuTypeSchema,
  payload: preprocess(
    (value) => (value == null ? undefined : value),
    z.string().nullable().optional(),
  ).optional(),
  url: preprocess(
    (value) => (value == null ? undefined : value),
    z.string().nullable().optional(),
  ).optional(),
});

export const contentTypeStubSchema = contentTypeObjectSchema;

export const contentTypeSchema = contentTypeObjectSchema;

export const contentTypeFullSchema = contentTypeObjectSchema;

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
    contentType: preprocess((value) => value, contentTypeSchema),
  }),
);

export const menuStubSchema = menuStubObjectSchema;

export const menuSchema = preprocess(
  (value) => withAliases(value, menuAliasMap),
  menuStubObjectSchema.extend({
    parent: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ).optional(),
  }),
);

export const menuFullSchema = preprocess(
  (value) => withAliases(value, menuAliasMap),
  menuStubObjectSchema.extend({
    parent: preprocess(
      (value) => (value == null ? null : value),
      menuSchema.nullable(),
    ).optional(),
    children: preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(menuSchema),
    ).optional(),
  }),
);

export type ContentTypeStub = z.infer<typeof contentTypeStubSchema>;

export type ContentType = z.infer<typeof contentTypeSchema>;

export type ContentTypeFull = z.infer<typeof contentTypeFullSchema>;

export type ContentStub = z.infer<typeof contentStubSchema>;

export type Content = z.infer<typeof contentSchema>;

export type ContentFull = z.infer<typeof contentFullSchema>;

export type MenuStub = z.infer<typeof menuStubSchema>;

export type Menu = z.infer<typeof menuSchema>;

export type MenuFull = z.infer<typeof menuFullSchema>;

export { MenuType };
