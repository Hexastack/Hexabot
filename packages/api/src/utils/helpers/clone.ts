/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

/**
 * Deep clones plain data structures using `structuredClone` when available,
 * falling back to JSON serialization otherwise.
 */
export const cloneObject = <T>(value: T): T => {
  if (value == null) {
    return value;
  }

  const structuredCloneFn = (
    globalThis as {
      structuredClone?: <U>(data: U) => U;
    }
  ).structuredClone;

  if (structuredCloneFn) {
    return structuredCloneFn(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};
