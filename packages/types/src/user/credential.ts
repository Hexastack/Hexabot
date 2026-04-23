/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { asId, withAliases } from "../shared/aliases";
import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { userSchema } from "./user";

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

export const credentialFullSchema = credentialStubObjectSchema.extend({
  owner: preprocess(
    (value) => (value == null ? null : value),
    z.lazy(() => userSchema).nullable(),
  ),
});

export type CredentialStub = z.infer<typeof credentialStubSchema>;

export type Credential = z.infer<typeof credentialSchema>;

export type CredentialFull = z.infer<typeof credentialFullSchema>;
