/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import {
  asId,
  baseStubSchema,
  preprocess,
  roleSchema as roleBaseSchema,
  userProfileAssignedSchema,
  userProfileStubSchema as userProfileBaseStubSchema,
  withAliases,
} from "./fragments";
import {
  Action,
  modelIdentitySchema,
  relationSchema,
  type TModel,
  type TRelation,
} from "./primitives";
import { userSchema } from "./user";

const modelStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
  identity: modelIdentitySchema,
  attributes: z.record(z.string(), z.unknown()),
  relation: preprocess(
    (value) => (value == null ? undefined : value),
    relationSchema.optional(),
  ).optional(),
});
const permissionAliasMap = {
  modelId: "model",
  roleId: "role",
} as const;
const permissionStubObjectSchema = baseStubSchema.extend({
  action: z.nativeEnum(Action),
  relation: relationSchema,
});

export const userProfileStubSchema = userProfileBaseStubSchema;

export const userProfileSchema = userProfileStubSchema;

export const userProfileFullSchema = userProfileStubSchema;

export const modelStubSchema = modelStubObjectSchema;

export const modelSchema = modelStubObjectSchema;

export const permissionStubSchema = permissionStubObjectSchema;

export const permissionSchema = preprocess(
  (value) => withAliases(value, permissionAliasMap),
  permissionStubObjectSchema.extend({
    model: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
    role: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const roleStubSchema = roleBaseSchema;

export const roleSchema = roleBaseSchema;

const credentialAliasMap = {
  ownerId: "owner",
} as const;
const credentialStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
});

export const credentialStubSchema = credentialStubObjectSchema;

export const credentialSchema = preprocess(
  (value) => withAliases(value, credentialAliasMap),
  credentialStubObjectSchema.extend({
    owner: preprocess(
      (value) => (value == null ? null : asId(value)),
      z.string(),
    ),
  }),
);

export const modelFullSchema = modelStubObjectSchema.extend({
  permissions: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(permissionSchema),
  ).optional(),
});

export const permissionFullSchema = preprocess(
  (value) => withAliases(value, permissionAliasMap),
  permissionStubObjectSchema.extend({
    model: preprocess((value) => value, modelSchema),
    role: preprocess((value) => value, roleSchema),
  }),
);

const roleFullObjectSchema = z.object({
  permissions: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(permissionSchema),
  ).optional(),
  users: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(userSchema),
  ),
});

export const roleFullSchema = z.intersection(
  roleBaseSchema,
  roleFullObjectSchema,
);

export const credentialFullSchema = preprocess(
  (value) => withAliases(value, credentialAliasMap),
  credentialStubObjectSchema.extend({
    owner: preprocess(
      (value) => (value == null ? null : value),
      userSchema.nullable(),
    ),
  }),
);

export type UserProfileStub = z.infer<typeof userProfileStubSchema>;

export type UserProfile = z.infer<typeof userProfileSchema>;

export type UserProfileFull = z.infer<typeof userProfileFullSchema>;

export type ModelStub = z.infer<typeof modelStubSchema>;

export type Model = z.infer<typeof modelSchema>;

export type ModelFull = z.infer<typeof modelFullSchema>;

export type PermissionStub = z.infer<typeof permissionStubSchema>;

export type Permission = z.infer<typeof permissionSchema>;

export type PermissionFull = z.infer<typeof permissionFullSchema>;

export type RoleStub = z.infer<typeof roleStubSchema>;

export type Role = z.infer<typeof roleSchema>;

export type RoleFull = z.infer<typeof roleFullSchema>;

export type CredentialStub = z.infer<typeof credentialStubSchema>;

export type Credential = z.infer<typeof credentialSchema>;

export type CredentialFull = z.infer<typeof credentialFullSchema>;

export const coerceUserProfileStub = (value: unknown): UserProfileStub => {
  return userProfileStubSchema.parse(value);
};

export const coerceUserProfile = (value: unknown): UserProfile => {
  return userProfileSchema.parse(value);
};

export const coerceUserProfileFull = (value: unknown): UserProfileFull => {
  return userProfileFullSchema.parse(value);
};

export const coerceUserProfileOptional = (
  value: unknown,
): UserProfile | undefined => {
  return value == null ? undefined : coerceUserProfile(value);
};

export const coerceUserProfileNullable = (
  value: unknown,
): UserProfile | null => {
  return value == null ? null : coerceUserProfile(value);
};

export const coerceUserProfileAssigned = (
  value: unknown,
): z.infer<typeof userProfileAssignedSchema> => {
  return userProfileAssignedSchema.parse(value);
};

export const coerceModelStub = (value: unknown): ModelStub => {
  return modelStubSchema.parse(value);
};

export const coerceModel = (value: unknown): Model => {
  return modelSchema.parse(value);
};

export const coerceModelFull = (value: unknown): ModelFull => {
  return modelFullSchema.parse(value);
};

export const coerceModelOptional = (value: unknown): Model | undefined => {
  return value == null ? undefined : coerceModel(value);
};

export const coerceModelNullable = (value: unknown): Model | null => {
  return value == null ? null : coerceModel(value);
};

export const coercePermissionStub = (value: unknown): PermissionStub => {
  return permissionStubSchema.parse(value);
};

export const coercePermission = (value: unknown): Permission => {
  return permissionSchema.parse(value);
};

export const coercePermissionFull = (value: unknown): PermissionFull => {
  return permissionFullSchema.parse(value);
};

export const coercePermissionOptional = (
  value: unknown,
): Permission | undefined => {
  return value == null ? undefined : coercePermission(value);
};

export const coercePermissionNullable = (value: unknown): Permission | null => {
  return value == null ? null : coercePermission(value);
};

export const coerceRoleStub = (value: unknown): RoleStub => {
  return roleStubSchema.parse(value);
};

export const coerceRole = (value: unknown): Role => {
  return roleSchema.parse(value);
};

export const coerceRoleFull = (value: unknown): RoleFull => {
  return roleFullSchema.parse(value);
};

export const coerceRoleOptional = (value: unknown): Role | undefined => {
  return value == null ? undefined : coerceRole(value);
};

export const coerceRoleNullable = (value: unknown): Role | null => {
  return value == null ? null : coerceRole(value);
};

export const coerceCredentialStub = (value: unknown): CredentialStub => {
  return credentialStubSchema.parse(value);
};

export const coerceCredential = (value: unknown): Credential => {
  return credentialSchema.parse(value);
};

export const coerceCredentialFull = (value: unknown): CredentialFull => {
  return credentialFullSchema.parse(value);
};

export const coerceCredentialOptional = (
  value: unknown,
): Credential | undefined => {
  return value == null ? undefined : coerceCredential(value);
};

export const coerceCredentialNullable = (value: unknown): Credential | null => {
  return value == null ? null : coerceCredential(value);
};

export type { TModel, TRelation };
