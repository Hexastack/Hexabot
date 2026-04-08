/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type PlainObject = Record<string, unknown>;

export const isPlainObject = (value: unknown): value is PlainObject => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.getPrototypeOf(value) === Object.prototype;
};

export const deepMerge = (
  target: PlainObject,
  source: PlainObject,
): PlainObject => {
  Object.entries(source).forEach(([key, value]) => {
    const currentValue = target[key];
    if (isPlainObject(currentValue) && isPlainObject(value)) {
      target[key] = deepMerge({ ...currentValue }, value);
    } else {
      target[key] = value;
    }
  });

  return target;
};
