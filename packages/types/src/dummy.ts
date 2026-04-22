/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema, preprocess } from "./fragments";

const dummyObjectSchema = baseStubSchema.extend({
  dummy: z.string(),
  dynamicField: preprocess(
    (value) => (value == null ? undefined : value),
    z.record(z.string(), z.unknown()).optional(),
  ).optional(),
});

export const dummyStubSchema = dummyObjectSchema;

export const dummySchema = dummyObjectSchema;

export const dummyFullSchema = dummyObjectSchema;

export type DummyStub = z.infer<typeof dummyStubSchema>;

export type Dummy = z.infer<typeof dummySchema>;

export type DummyFull = z.infer<typeof dummyFullSchema>;

export const coerceDummyStub = (value: unknown): DummyStub => {
  return dummyStubSchema.parse(value);
};

export const coerceDummy = (value: unknown): Dummy => {
  return dummySchema.parse(value);
};

export const coerceDummyFull = (value: unknown): DummyFull => {
  return dummyFullSchema.parse(value);
};

export const coerceDummyOptional = (value: unknown): Dummy | undefined => {
  return value == null ? undefined : coerceDummy(value);
};

export const coerceDummyNullable = (value: unknown): Dummy | null => {
  return value == null ? null : coerceDummy(value);
};
