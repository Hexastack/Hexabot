/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const cloneWithPrototype = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
};
