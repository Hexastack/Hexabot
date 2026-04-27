/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { hasForbiddenSegment } from './safe-property-path';

describe('hasForbiddenSegment', () => {
  it.each(['__proto__', 'constructor', 'prototype'])(
    'should detect forbidden key "%s" as a standalone segment',
    (key) => {
      expect(hasForbiddenSegment(key)).toBe(true);
    },
  );

  it.each(['__proto__.polluted', 'a.constructor.b', 'x.prototype'])(
    'should detect forbidden key in nested path "%s"',
    (path) => {
      expect(hasForbiddenSegment(path)).toBe(true);
    },
  );

  it.each(['name', 'user.email', 'nested.deep.field'])(
    'should allow safe path "%s"',
    (path) => {
      expect(hasForbiddenSegment(path)).toBe(false);
    },
  );
});
