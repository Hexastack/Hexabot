/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const isRecord = (item: unknown): item is Record<string, unknown> => {
  return item !== null && typeof item === "object" && !Array.isArray(item);
};

export function merge<
  T extends Record<string, any>,
  U extends Record<string, any>,
>(target: T, source: U): T & U {
  const output: Record<string, any> = { ...target };

  if (isRecord(target) && isRecord(source)) {
    Object.keys(source).forEach((key) => {
      if (Array.isArray(source[key])) {
        if (Array.isArray(target[key])) {
          // Merge arrays uniquely
          output[key] = Array.from(new Set([...target[key], ...source[key]]));
        } else {
          output[key] = source[key];
        }
      } else if (isRecord(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = merge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output as T & U;
}
