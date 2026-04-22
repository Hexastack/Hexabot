/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema, preprocess } from "./fragments";

export const settingValueSchema = z.union([
  z.null(),
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.record(z.string(), z.unknown()),
]);

const settingObjectSchema = baseStubSchema.extend({
  group: z.string(),
  subgroup: preprocess(
    (value) => (value == null ? null : value),
    z.string().nullable().optional(),
  ).optional(),
  label: z.string(),
  value: settingValueSchema,
});
const metadataObjectSchema = baseStubSchema.extend({
  name: z.string(),
  value: z.any(),
});

export const settingStubSchema = settingObjectSchema;

export const settingSchema = settingObjectSchema;

export const settingFullSchema = settingObjectSchema;

export const metadataStubSchema = metadataObjectSchema;

export const metadataSchema = metadataObjectSchema;

export const metadataFullSchema = metadataObjectSchema;

export type SettingStub = z.infer<typeof settingStubSchema>;

export type Setting = z.infer<typeof settingSchema>;

export type SettingFull = z.infer<typeof settingFullSchema>;

export type MetadataStub = z.infer<typeof metadataStubSchema>;

export type Metadata = z.infer<typeof metadataSchema>;

export type MetadataFull = z.infer<typeof metadataFullSchema>;

export const coerceSettingStub = (value: unknown): SettingStub => {
  return settingStubSchema.parse(value);
};

export const coerceSetting = (value: unknown): Setting => {
  return settingSchema.parse(value);
};

export const coerceSettingFull = (value: unknown): SettingFull => {
  return settingFullSchema.parse(value);
};

export const coerceSettingOptional = (value: unknown): Setting | undefined => {
  return value == null ? undefined : coerceSetting(value);
};

export const coerceSettingNullable = (value: unknown): Setting | null => {
  return value == null ? null : coerceSetting(value);
};

export const coerceMetadataStub = (value: unknown): MetadataStub => {
  return metadataStubSchema.parse(value);
};

export const coerceMetadata = (value: unknown): Metadata => {
  return metadataSchema.parse(value);
};

export const coerceMetadataFull = (value: unknown): MetadataFull => {
  return metadataFullSchema.parse(value);
};

export const coerceMetadataOptional = (
  value: unknown,
): Metadata | undefined => {
  return value == null ? undefined : coerceMetadata(value);
};

export const coerceMetadataNullable = (value: unknown): Metadata | null => {
  return value == null ? null : coerceMetadata(value);
};

export enum FieldType {
  text = "text",
  url = "url",
  textarea = "textarea",
  checkbox = "checkbox",
  file = "file",
  html = "html",
}
