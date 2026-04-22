/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { baseStubSchema } from "../shared/base";
import { preprocess } from "../shared/preprocess";

import { labelSchema } from "./label";

const labelGroupObjectSchema = baseStubSchema.extend({
  name: z.string(),
});

export const labelGroupStubSchema = labelGroupObjectSchema;

export const labelGroupSchema = labelGroupObjectSchema.extend({
  labels: preprocess(() => undefined, z.undefined().optional()).optional(),
});

export const labelGroupFullSchema = labelGroupObjectSchema.extend({
  labels: preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.lazy(() => labelSchema)),
  ).optional(),
});

export type LabelGroupStub = z.infer<typeof labelGroupStubSchema>;

export type LabelGroup = z.infer<typeof labelGroupSchema>;

export type LabelGroupFull = z.infer<typeof labelGroupFullSchema>;
