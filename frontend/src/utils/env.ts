/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export const parseEnvNumber = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);

  return isNaN(parsed) ? fallback : parsed;
};
// Utility to parse environment variable as boolean
export const parseEnvBoolean = (
  value: string | undefined,
  fallback: boolean,
): boolean => {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.toLowerCase() === "true";
};
