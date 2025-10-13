/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const truncate = (text: string, length = 300) => {
  return text.length > length ? text.substring(0, length) + "..." : text;
};
