/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function hasForbiddenSegment(path: string): boolean {
  return path.split('.').some((segment) => FORBIDDEN_SEGMENTS.has(segment));
}
