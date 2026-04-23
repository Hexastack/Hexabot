/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { Action, relationSchema } from "./domain";
import { modelSchema } from "./model";
import { roleSchema } from "./role";

const permissionAliasMap = {
  modelId: "model",
  roleId: "role",
} as const;
const permissionStubObjectSchema = baseStubSchema.extend({
  action: z.enum(Action),
  relation: relationSchema,
});

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

export const permissionFullSchema = permissionStubObjectSchema.extend({
  model: z.lazy(() => modelSchema),
  role: z.lazy(() => roleSchema),
});

export type PermissionStub = z.infer<typeof permissionStubSchema>;

export type Permission = z.infer<typeof permissionSchema>;

export type PermissionFull = z.infer<typeof permissionFullSchema>;
