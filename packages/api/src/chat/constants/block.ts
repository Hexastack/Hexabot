/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FallbackOptions } from '../types/options';

export function getDefaultFallbackOptions(): FallbackOptions {
  return {
    active: false,
    max_attempts: 0,
    message: [],
  };
}

// Default maximum number of blocks returned by full-text search
export const DEFAULT_BLOCK_SEARCH_LIMIT = 500;
