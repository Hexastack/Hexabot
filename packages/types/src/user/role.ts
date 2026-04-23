/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { permissionSchema } from "./permission";
import { userSchema } from "./user";

const roleBaseSchema = baseStubSchema.extend({
  name: z.string(),
  active: z.coerce.boolean(),
});
const roleFullObjectSchema = z.object({
  permissions: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.lazy(() => permissionSchema)),
  ).optional(),
  users: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.lazy(() => userSchema)),
  ),
});

export const roleStubSchema = roleBaseSchema;

export const roleSchema = roleBaseSchema;

export const roleFullSchema = z.intersection(
  roleBaseSchema,
  roleFullObjectSchema,
);

export type RoleStub = z.infer<typeof roleStubSchema>;

export type Role = z.infer<typeof roleSchema>;

export type RoleFull = z.infer<typeof roleFullSchema>;
