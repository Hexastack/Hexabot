/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const validateUniqueFields = <T>(
  fields: T[],
  fieldName: keyof T,
): boolean =>
  new Set(fields.map((f) => f[fieldName] as string)).size === fields.length;
