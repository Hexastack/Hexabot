/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { withAliases } from "../shared/aliases";
import { preprocess } from "../shared/preprocess";
import { workflowSchema } from "../workflow/workflow";

import { sourceAliasMap, sourceObjectSchema } from "./source";

export const sourceFullSchema = preprocess(
  (value) => withAliases(value, sourceAliasMap),
  sourceObjectSchema.extend({
    defaultWorkflow: preprocess(
      (value) => (value == null ? null : value),
      z.lazy(() => workflowSchema).nullable(),
    ),
  }),
);

export type SourceFull = z.infer<typeof sourceFullSchema>;
