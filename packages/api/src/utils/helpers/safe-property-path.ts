/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import toPath from 'lodash/toPath';

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export function hasForbiddenSegment(path: string): boolean {
  return toPath(path).some((segment) => FORBIDDEN_SEGMENTS.has(segment));
}
