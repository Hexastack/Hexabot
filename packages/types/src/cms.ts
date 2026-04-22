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

export const coerceContentTypeStub = (value: unknown): ContentTypeStub => {
  return contentTypeStubSchema.parse(value);
};

export const coerceContentType = (value: unknown): ContentType => {
  return contentTypeSchema.parse(value);
};

export const coerceContentTypeFull = (value: unknown): ContentTypeFull => {
  return contentTypeFullSchema.parse(value);
};

export const coerceContentTypeOptional = (
  value: unknown,
): ContentType | undefined => {
  return value == null ? undefined : coerceContentType(value);
};

export const coerceContentTypeNullable = (
  value: unknown,
): ContentType | null => {
  return value == null ? null : coerceContentType(value);
};

export const coerceContentStub = (value: unknown): ContentStub => {
  return contentStubSchema.parse(value);
};

export const coerceContent = (value: unknown): Content => {
  return contentSchema.parse(value);
};

export const coerceContentFull = (value: unknown): ContentFull => {
  return contentFullSchema.parse(value);
};

export const coerceContentOptional = (value: unknown): Content | undefined => {
  return value == null ? undefined : coerceContent(value);
};

export const coerceContentNullable = (value: unknown): Content | null => {
  return value == null ? null : coerceContent(value);
};

export const coerceMenuStub = (value: unknown): MenuStub => {
  return menuStubSchema.parse(value);
};

export const coerceMenu = (value: unknown): Menu => {
  return menuSchema.parse(value);
};

export const coerceMenuFull = (value: unknown): MenuFull => {
  return menuFullSchema.parse(value);
};

export const coerceMenuOptional = (value: unknown): Menu | undefined => {
  return value == null ? undefined : coerceMenu(value);
};

export const coerceMenuNullable = (value: unknown): Menu | null => {
  return value == null ? null : coerceMenu(value);
};

export { MenuType };
