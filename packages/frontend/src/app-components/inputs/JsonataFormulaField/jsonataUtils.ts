/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export function isIdentifierSafe(name: string) {
  // JSONata identifiers similar to JS-ish: start letter/_/$ then alnum/_/$
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

export function formatSegmentForJsonata(name: string) {
  return isIdentifierSafe(name) ? name : `"${name.replace(/"/g, '\\"')}"`;
}

export function indexToLineCol(
  text: string,
  index: number,
): { line: number; col: number } {
  let line = 0;
  let lastNL = -1;

  for (let i = 0; i < text.length && i < index; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) {
      line++;
      lastNL = i;
    }
  }

  return { line, col: index - (lastNL + 1) };
}

export const toPxValue = (
  value: number | string | undefined,
  fallback: number,
  htmlFontSize: number,
) => {
  if (typeof value === "number") return value;
  if (!value) return fallback;

  const trimmed = value.trim();

  if (trimmed.endsWith("rem")) {
    const parsed = Number.parseFloat(trimmed);

    return Number.isFinite(parsed) ? parsed * htmlFontSize : fallback;
  }

  if (trimmed.endsWith("px")) {
    const parsed = Number.parseFloat(trimmed);

    return Number.isFinite(parsed) ? parsed : fallback;
  }

  const parsed = Number.parseFloat(trimmed);

  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toLineHeightPx = (
  value: number | string | undefined,
  fontSizePx: number,
  htmlFontSize: number,
) => {
  if (typeof value === "number") {
    return Math.round(value * fontSizePx);
  }

  if (!value) {
    return Math.round(fontSizePx * 1.5);
  }

  const trimmed = value.trim();

  if (trimmed.endsWith("rem")) {
    const parsed = Number.parseFloat(trimmed);

    return Number.isFinite(parsed)
      ? Math.round(parsed * htmlFontSize)
      : Math.round(fontSizePx * 1.5);
  }

  if (trimmed.endsWith("px")) {
    const parsed = Number.parseFloat(trimmed);

    return Number.isFinite(parsed)
      ? Math.round(parsed)
      : Math.round(fontSizePx * 1.5);
  }

  const parsed = Number.parseFloat(trimmed);

  return Number.isFinite(parsed)
    ? Math.round(parsed * fontSizePx)
    : Math.round(fontSizePx * 1.5);
};