/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

type ParsedColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};
const formatAlpha = (value: number) => {
  return `${Math.round(value * 1000) / 1000}`;
};
const parseHex = (value: string): ParsedColor | undefined => {
  const hex = value.trim().replace("#", "");

  if (hex.length === 3 || hex.length === 4) {
    const [r, g, b, a] = hex.split("");

    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
      a: a ? Number.parseInt(`${a}${a}`, 16) / 255 : 1,
    };
  }

  if (hex.length === 6 || hex.length === 8) {
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
      a:
        hex.length === 8
          ? Number.parseInt(hex.slice(6, 8), 16) / 255
          : 1,
    };
  }

  return undefined;
};
const parseAlphaToken = (token?: string) => {
  if (!token) {
    return 1;
  }

  const normalized = token.trim();

  if (normalized.endsWith("%")) {
    return clamp(Number.parseFloat(normalized) / 100, 0, 1);
  }

  return clamp(Number.parseFloat(normalized), 0, 1);
};
const parseRgb = (value: string): ParsedColor | undefined => {
  const match = value
    .trim()
    .match(
      /^rgba?\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)(?:\s*,\s*([+-]?\d*\.?\d+%?))?\s*\)$/i,
    );

  if (!match) {
    return undefined;
  }

  return {
    r: clamp(Number.parseFloat(match[1] ?? "0"), 0, 255),
    g: clamp(Number.parseFloat(match[2] ?? "0"), 0, 255),
    b: clamp(Number.parseFloat(match[3] ?? "0"), 0, 255),
    a: parseAlphaToken(match[4]),
  };
};
const parseColor = (value: string): ParsedColor | undefined => {
  if (value.trim().startsWith("#")) {
    return parseHex(value);
  }

  if (value.trim().toLowerCase().startsWith("rgb")) {
    return parseRgb(value);
  }

  return undefined;
};

export const withAlpha = (color: string, alpha: number) => {
  const targetAlpha = clamp(alpha, 0, 1);
  const parsed = parseColor(color);

  if (!parsed) {
    return `color-mix(in srgb, ${color} ${targetAlpha * 100}%, transparent)`;
  }

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${formatAlpha(parsed.a * targetAlpha)})`;
};
