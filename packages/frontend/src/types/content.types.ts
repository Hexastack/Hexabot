/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Content as SharedContent } from "@hexabot-ai/types";

import { TNestedPaths } from "./base.types";

export type IContentAttributes = Pick<
  SharedContent,
  "contentType" | "title" | "status" | "properties"
>;

export interface IContentFilters
  extends TNestedPaths<{ contentType: { id: string } }> {
  title: string;
}
