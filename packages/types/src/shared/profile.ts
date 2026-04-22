/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "./base";
import { preprocess } from "./preprocess";

export const nullableStringSchema = preprocess(
  (value) => (value == null ? null : value),
  z.string().nullable(),
);

export const nullableDateSchema = preprocess(
  (value) => (value == null ? null : value),
  z.coerce.date().nullable(),
);

export const userProfileBaseSchema = baseStubSchema.extend({
  firstName: z.string(),
  lastName: z.string(),
  language: nullableStringSchema,
  timezone: z.coerce.number().default(0),
});

export const subscriberChannelSchema = z.object({
  name: nullableStringSchema,
  data: preprocess(
    (value) => (value == null ? null : value),
    z.record(z.string(), z.any()).nullable(),
  ).optional(),
});

export const subscriberBaseSchema = userProfileBaseSchema.extend({
  locale: nullableStringSchema,
  gender: nullableStringSchema,
  country: nullableStringSchema,
  foreignId: nullableStringSchema,
  assignedAt: nullableDateSchema,
  lastvisit: nullableDateSchema,
  retainedFrom: nullableDateSchema,
  channel: preprocess(
    (value) => value ?? { name: null, data: null },
    subscriberChannelSchema,
  ),
});
