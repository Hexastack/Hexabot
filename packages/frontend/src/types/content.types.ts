/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TNestedPaths } from "./base.types";

export interface IContentFilters
  extends TNestedPaths<{ contentType: { id: string } }> {
  title: string;
}
