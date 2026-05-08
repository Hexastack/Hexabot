/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const sanitizeCredential = <T extends Record<string, unknown>>(
  credential: T,
): T => {
  const { value: _value, ...safeCredential } = credential;

  return safeCredential as T;
};
