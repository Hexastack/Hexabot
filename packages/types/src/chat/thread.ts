/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { sourceSchema } from "../channel/source";
import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { subscriberSchema } from "./subscriber";

const nullableOptionalDateSchema = z.coerce.date().nullable().optional();
const nullableOptionalStringSchema = z.string().nullable().optional();
const threadAliasMap = {
  subscriberId: "subscriber",
  sourceId: "source",
} as const;
const threadStubObjectSchema = baseStubSchema.extend({
  status: z.enum(["open", "closed"]),
  lastMessageAt: nullableOptionalDateSchema,
  closedAt: nullableOptionalDateSchema,
  closeReason: z.enum(["manual", "inactivity"]).nullable().optional(),
  title: nullableOptionalStringSchema,
});

export const threadStubSchema = threadStubObjectSchema;

export const threadSchema = preprocess(
  (value) => withAliases(value, threadAliasMap),
  threadStubObjectSchema.extend({
    subscriber: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    source: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const threadFullSchema = threadStubObjectSchema.extend({
  subscriber: subscriberSchema,
  source: sourceSchema,
});

export type ThreadStub = z.infer<typeof threadStubSchema>;

export type Thread = z.infer<typeof threadSchema>;

export type ThreadFull = z.infer<typeof threadFullSchema>;
