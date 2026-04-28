/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { hasForbiddenSegment } from './safe-property-path';

describe('hasForbiddenSegment', () => {
  it.each(['__proto__', 'constructor', 'prototype'])(
    'should detect forbidden single segment: %s',
    (segment) => {
      expect(hasForbiddenSegment(segment)).toBe(true);
    },
  );

  it.each([
    '__proto__.polluted',
    'nested.__proto__.key',
    'a.constructor.b',
    'a.b.prototype',
    '__proto__[polluted]',
    'a[constructor][prototype]',
    'a[__proto__].b',
  ])('should detect forbidden segment in nested path: %s', (path) => {
    expect(hasForbiddenSegment(path)).toBe(true);
  });

  it.each([
    'name',
    'user.email',
    'nested.field.value',
    'constructorName',
    'meta[constructorName]',
  ])(
    'should allow safe path: %s',
    (path) => {
      expect(hasForbiddenSegment(path)).toBe(false);
    },
  );
});
