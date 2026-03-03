/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import chroma from "chroma-js";

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};
const formatAlpha = (value: number) => {
  return `${Math.round(value * 1000) / 1000}`;
};

export const withAlpha = (color: string, alpha: number) => {
  const targetAlpha = clamp(alpha, 0, 1);

  if (!chroma.valid(color)) {
    return `color-mix(in srgb, ${color} ${targetAlpha * 100}%, transparent)`;
  }

  const [r, g, b, currentAlpha] = chroma(color).rgba();
  const nextAlpha = formatAlpha(clamp(currentAlpha * targetAlpha, 0, 1));

  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${nextAlpha})`;
};
