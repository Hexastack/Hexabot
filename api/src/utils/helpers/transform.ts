/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

/**
 * Recursively converts string values that can be parsed as numbers into actual numbers.
 * If the value is an array or object, the function will apply the transformation to each element or property recursively.
 * If the value is a string that can be converted to a number, it will return the number.
 * If the value is not a string or cannot be converted to a number, it will return the value as is.
 *
 * @param value - The value to be transformed, which can be a string, array, object, or any other type.
 * @returns The transformed value, where strings representing numbers are converted to numbers.
 *
 * @example
 * // String to number conversion
 * transformToNumeric('123'); // Output: 123
 *
 * @example
 * // Non-numeric string remains unchanged
 * transformToNumeric('abc'); // Output: 'abc'
 *
 * @example
 * // Numbers are returned as is
 * transformToNumeric(123); // Output: 123
 *
 * @example
 * // Arrays are transformed recursively
 * transformToNumeric(['123', 'abc', '45.67', 89]);
 * // Output: [123, 'abc', 45.67, 89]
 *
 * @example
 * // Objects are transformed recursively
 * transformToNumeric({
 *   a: '123',
 *   b: 'abc',
 *   c: { d: '45.67', e: 89 },
 * });
 * // Output: {
 * //   a: 123,
 * //   b: 'abc',
 * //   c: { d: 45.67, e: 89 },
 * // }
 *
 * @example
 * // Nested structures are handled correctly
 * transformToNumeric({
 *   a: ['123', 'abc', { b: '45.67', c: 'def' }],
 *   d: '99',
 * });
 * // Output: {
 * //   a: [123, 'abc', { b: 45.67, c: 'def' }],
 * //   d: 99,
 * // }
 */
export function transformToNumeric(value: unknown): unknown {
  if (typeof value === 'string' && !isNaN(Number(value))) {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(transformToNumeric);
  }

  if (typeof value === 'object' && value !== null) {
    const transformedObject: Record<string, unknown> = {};
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        transformedObject[key] = transformToNumeric(
          (value as Record<string, unknown>)[key],
        );
      }
    }
    return transformedObject;
  }
  return value;
}
