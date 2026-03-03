/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { withAlpha } from "./color.utils";

describe("color.utils", () => {
  it("applies alpha to hex colors", () => {
    expect(withAlpha("#fefbe8", 0.5)).toBe("rgba(254, 251, 232, 0.5)");
  });

  it("preserves existing hex alpha before applying additional alpha", () => {
    expect(withAlpha("#0004", 0.5)).toBe("rgba(0, 0, 0, 0.135)");
  });

  it("applies alpha to rgb and rgba colors", () => {
    expect(withAlpha("rgb(10, 20, 30)", 0.25)).toBe("rgba(10, 20, 30, 0.25)");
    expect(withAlpha("rgba(10, 20, 30, 0.4)", 0.5)).toBe(
      "rgba(10, 20, 30, 0.2)",
    );
  });

  it("falls back to color-mix for unsupported formats", () => {
    expect(withAlpha("var(--brand)", 0.4)).toBe(
      "color-mix(in srgb, var(--brand) 40%, transparent)",
    );
  });
});
