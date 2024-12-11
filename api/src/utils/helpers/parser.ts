/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

/**
 * Recursively converts string representations of numbers to actual numbers in an object or array.
 *
 * @param obj - The input value which can be an object, array, string, or other data type.
 *   - If the input is an array, each element is processed recursively.
 *   - If the input is an object, each property value is processed recursively.
 *   - If the input is a numeric string, it is converted to a number.
 *   - Other data types are returned unchanged.
 * @returns The transformed object or array with numeric strings converted to numbers.
 */
export function parseNumbersInObject(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(parseNumbersInObject);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.entries(obj).reduce(
      (acc, [key, value]) => {
        acc[key] = parseNumbersInObject(value);
        return acc;
      },
      {} as Record<string, any>,
    );
  } else if (typeof obj === 'string' && !isNaN(Number(obj))) {
    return Number(obj);
  }
  return obj;
}
