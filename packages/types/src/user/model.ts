/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { modelIdentitySchema, relationSchema } from "./domain";
import { permissionSchema } from "./permission";

const modelStubObjectSchema = baseStubSchema.extend({
  name: z.string(),
  identity: modelIdentitySchema,
  attributes: z.record(z.string(), z.unknown()),
  relation: preprocess(
    (value) => (value == null ? undefined : value),
    relationSchema.optional(),
  ).optional(),
});

export const modelStubSchema = modelStubObjectSchema;

export const modelSchema = modelStubObjectSchema;

export const modelFullSchema = modelStubObjectSchema.extend({
  permissions: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.lazy(() => permissionSchema)),
  ).optional(),
});

export type ModelStub = z.infer<typeof modelStubSchema>;

export type Model = z.infer<typeof modelSchema>;

export type ModelFull = z.infer<typeof modelFullSchema>;
