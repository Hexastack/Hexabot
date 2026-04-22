/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Model as SharedModel } from "@hexabot-ai/types";

export type TRelation = SharedModel["relation"];

export type IModelAttributes = Pick<
  SharedModel,
  "name" | "identity" | "attributes" | "relation"
>;
