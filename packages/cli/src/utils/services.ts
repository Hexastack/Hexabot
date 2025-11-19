/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const parseServices = (serviceString: string): string[] => {
  return serviceString
    .split(',')
    .map((service) => service.trim())
    .filter((s) => s);
};
