/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

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
