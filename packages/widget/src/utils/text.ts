/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export const truncate = (s: string, length = 100) => {
  return s.length > length ? s.substr(0, length) + "..." : s;
};

export const linebreak = (s: string) => {
  return s.replace(/\n/g, "<br />");
};

export const processContent = (s: string) => {
  let result = truncate(s, 50);

  result = linebreak(s);

  return result;
};
