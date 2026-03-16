/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type RagMode = 'embedding' | 'lexical';

export interface RagQueryOptions {
  mode?: RagMode;
  limit?: number;
  contentTypeId?: string;
  includeInactive?: boolean;
}

export interface RagHit {
  contentId: string;
  title: string;
  text: string;
  score?: number;
  contentTypeId?: string;
  source: RagMode;
}
