/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type ContentRagMode = 'embedding' | 'lexical';

export interface ContentRagQueryOptions {
  mode?: ContentRagMode;
  limit?: number;
  contentTypeId?: string;
  includeInactive?: boolean;
}

export interface ContentRagHit {
  contentId: string;
  title: string;
  text: string;
  score?: number;
  contentTypeId?: string;
  source: ContentRagMode;
}
