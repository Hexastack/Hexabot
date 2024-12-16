/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { transformToNumeric } from './transform';

describe('transformToNumeric', () => {
  test('should convert numeric strings to numbers', () => {
    expect(transformToNumeric('123')).toBe(123);
    expect(transformToNumeric('45.67')).toBe(45.67);
  });

  test('should return numbers as is', () => {
    expect(transformToNumeric(123)).toBe(123);
    expect(transformToNumeric(45.67)).toBe(45.67);
  });

  test('should not transform non-numeric strings', () => {
    expect(transformToNumeric('abc')).toBe('abc');
    expect(transformToNumeric('123abc')).toBe('123abc');
  });

  test('should transform arrays recursively', () => {
    expect(transformToNumeric(['123', 'abc', '45.67', 89])).toEqual([
      123,
      'abc',
      45.67,
      89,
    ]);
  });

  test('should transform objects recursively', () => {
    const input = {
      a: '123',
      b: 'abc',
      c: {
        d: '45.67',
        e: 89,
      },
    };
    const output = {
      a: 123,
      b: 'abc',
      c: {
        d: 45.67,
        e: 89,
      },
    };
    expect(transformToNumeric(input)).toEqual(output);
  });

  test('should handle mixed nested structures', () => {
    const input = {
      a: ['123', 'abc', { b: '45.67', c: 'def' }],
      d: '99',
    };
    const output = {
      a: [123, 'abc', { b: 45.67, c: 'def' }],
      d: 99,
    };
    expect(transformToNumeric(input)).toEqual(output);
  });

  test('should handle null and undefined', () => {
    expect(transformToNumeric(null)).toBe(null);
    expect(transformToNumeric(undefined)).toBe(undefined);
  });

  test('should handle empty objects and arrays', () => {
    expect(transformToNumeric({})).toEqual({});
    expect(transformToNumeric([])).toEqual([]);
  });
});
