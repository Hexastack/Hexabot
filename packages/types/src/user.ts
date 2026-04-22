/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { attachmentSchema } from "./attachment";
import {
  asId,
  asIdArray,
  labelSchema,
  preprocess,
  roleSchema,
  subscriberStubSchema,
  userProfileAssignedSchema,
  userProviderSchema,
  withAliases,
} from "./fragments";

const userAliasMap = {
  labelIds: "labels",
  assignedToId: "assignedTo",
  roleIds: "roles",
  avatarId: "avatar",
} as const;
const userStubObjectSchema = subscriberStubSchema.extend({
  username: z.string(),
  email: z.string(),
  sendEmail: z.coerce.boolean(),
  state: z.coerce.boolean(),
  resetCount: z.coerce.number(),
  resetToken: preprocess(
    (value) => (value == null ? null : value),
    z.string().nullable(),
  ),
  provider: userProviderSchema.optional(),
});

export const userStubSchema = userStubObjectSchema;

export const userSchema = preprocess(
  (value) => withAliases(value, userAliasMap),
  userStubObjectSchema.extend({
    labels: preprocess(
      (value) => (Array.isArray(value) ? asIdArray(value) : []),
      z.array(z.string()),
    ),
    assignedTo: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
    roles: preprocess(
      (value) => (Array.isArray(value) ? asIdArray(value) : []),
      z.array(z.string()),
    ),
    avatar: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string().nullable(),
    ),
  }),
);

export const userFullSchema = preprocess(
  (value) => withAliases(value, userAliasMap),
  userStubObjectSchema.extend({
    labels: preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(labelSchema),
    ),
    assignedTo: preprocess(
      (value) => (value == null ? null : value),
      userProfileAssignedSchema.nullable(),
    ),
    roles: preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(roleSchema),
    ),
    avatar: preprocess(
      (value) => (value == null ? null : value),
      attachmentSchema.nullable(),
    ),
  }),
);

export type UserStub = z.infer<typeof userStubSchema>;

export type User = z.infer<typeof userSchema>;

export type UserFull = z.infer<typeof userFullSchema>;

export const coerceUserStub = (value: unknown): UserStub => {
  return userStubSchema.parse(value);
};

export const coerceUser = (value: unknown): User => {
  return userSchema.parse(value);
};

export const coerceUserFull = (value: unknown): UserFull => {
  return userFullSchema.parse(value);
};

export const coerceUserNullable = (value: unknown): User | null => {
  return value == null ? null : coerceUser(value);
};

export const coerceUserOptional = (value: unknown): User | undefined => {
  return value == null ? undefined : coerceUser(value);
};
