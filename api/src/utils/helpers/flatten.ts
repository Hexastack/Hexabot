/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
