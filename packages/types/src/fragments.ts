/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

export const preprocess = <T>(
  transformer: (value: unknown) => unknown,
  schema: z.ZodType<T>,
): z.ZodType<T> => {
  return z.preprocess(transformer, schema) as z.ZodType<T>;
};

const nullableStringSchema = preprocess(
  (value) => (value == null ? null : value),
  z.string().nullable(),
);
const nullableDateSchema = preprocess(
  (value) => (value == null ? null : value),
  z.coerce.date().nullable(),
);
const nullableNumberSchema = preprocess(
  (value) => (value == null ? null : value),
  z.coerce.number().nullable(),
);
const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};
const cloneWithPrototype = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
};

export const withAliases = (
  value: unknown,
  aliases: Record<string, string>,
): unknown => {
  const record = toRecord(value);
  if (!record) {
    return value;
  }

  const next = cloneWithPrototype(record);

  for (const [from, to] of Object.entries(aliases)) {
    if (next[to] === undefined && next[from] !== undefined) {
      next[to] = next[from];
    }
  }

  return next;
};

export const asId = (value: unknown): unknown => {
  if (value == null || typeof value === "string") {
    return value;
  }

  const record = toRecord(value);
  if (!record) {
    return value;
  }

  return typeof record.id === "string" ? record.id : value;
};

export const asIdArray = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((entry) => asId(entry));
};

export const baseStubSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const userProviderSchema = z.object({
  strategy: z.literal("local"),
  sub: z.string().optional(),
});

export type UserProvider = z.infer<typeof userProviderSchema>;

export const userProfileStubSchema = baseStubSchema.extend({
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

export const subscriberStubSchema = userProfileStubSchema.extend({
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

const subscriberAliasMap = {
  labelIds: "labels",
  assignedToId: "assignedTo",
  avatarId: "avatar",
} as const;
const subscriberObjectSchema = subscriberStubSchema.extend({
  labels: preprocess(
    (value) => (Array.isArray(value) ? asIdArray(value) : []),
    z.array(z.string()),
  ),
  assignedTo: preprocess(
    (value) => (value == null ? null : asId(value)),
    z.string().nullable(),
  ),
  avatar: preprocess(
    (value) => (value == null ? null : asId(value)),
    z.string().nullable(),
  ),
});

export const subscriberSchema = preprocess(
  (value) => withAliases(value, subscriberAliasMap),
  subscriberObjectSchema,
);

export const roleSchema = baseStubSchema.extend({
  name: z.string(),
  active: z.coerce.boolean(),
});

const userProfileAssignedAliasMap = {
  labelIds: "labels",
  assignedToId: "assignedTo",
  roleIds: "roles",
  avatarId: "avatar",
} as const;
const userProfileAssignedObjectSchema = subscriberStubSchema.extend({
  labels: preprocess(
    (value) => (Array.isArray(value) ? asIdArray(value) : []),
    z.array(z.string()),
  ),
  assignedTo: preprocess(
    (value) => (value == null ? null : asId(value)),
    z.string().nullable(),
  ),
  username: z.string(),
  email: z.string(),
  sendEmail: z.coerce.boolean(),
  state: z.coerce.boolean(),
  resetCount: z.coerce.number(),
  resetToken: nullableStringSchema,
  provider: userProviderSchema.optional(),
  roles: preprocess(
    (value) => (Array.isArray(value) ? asIdArray(value) : []),
    z.array(z.string()),
  ),
  avatar: preprocess(
    (value) => (value == null ? null : asId(value)),
    z.string().nullable(),
  ),
});

export const userProfileAssignedSchema = preprocess(
  (value) => withAliases(value, userProfileAssignedAliasMap),
  userProfileAssignedObjectSchema,
);

export const labelSchema = baseStubSchema.extend({
  title: z.string(),
  name: z.string(),
  label_id: z.record(z.string(), z.unknown()).nullable().optional(),
  description: nullableStringSchema.optional(),
  builtin: z.coerce.boolean(),
});

export const plainReferenceSchema = baseStubSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const paginationLikeSchema = z.object({
  take: nullableNumberSchema.optional(),
  skip: nullableNumberSchema.optional(),
});

export type SubscriberStub = z.infer<typeof subscriberStubSchema>;

export type Subscriber = z.infer<typeof subscriberSchema>;

export type UserProfileAssigned = z.infer<typeof userProfileAssignedSchema>;

export type Role = z.infer<typeof roleSchema>;

export type Label = z.infer<typeof labelSchema>;
