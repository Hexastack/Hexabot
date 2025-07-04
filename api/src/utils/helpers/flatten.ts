/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

const isPlainObject = (val: unknown): val is Record<string, unknown> => {
  return val?.constructor === Object;
};

/**
 * Flattens a nested object into a single-level object with dot-separated keys.
 * @param data - The data object to flatten
 * @param prefix - The optional base key to prefix to the current object's keys
 * @param result - The optional accumulator for the flattened object  data
 * @returns A new object with flattened keys
 * @throws Error if the data is an array
 */
export const flatten = (
  data: object,
  prefix: string | undefined = undefined,
  result: object = {},
): object => {
  if (Array.isArray(data)) {
    throw new Error('Data should be an object!');
  }

  for (const [key, value] of Object.entries(data)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      flatten(value, path, result);
    } else {
      result[path] = value;
    }
  }

  return result;
};
