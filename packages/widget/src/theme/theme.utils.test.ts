/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { resolveWidgetTheme } from "./theme.utils";

describe("resolveWidgetTheme", () => {
  it("uses explicit widget config over server settings and system preference", () => {
    const theme = resolveWidgetTheme({
      configTheme: {
        mode: "light",
        palette: "red",
      },
      settingsTheme: {
        mode: "dark",
        palette: "green",
      },
      prefersDarkMode: true,
    });

    expect(theme.mode).toBe("light");
    expect(theme.resolvedMode).toBe("light");
    expect(theme.palette.key).toBe("red");
  });

  it("falls back to a safe palette key when unknown keys are provided", () => {
    const theme = resolveWidgetTheme({
      configTheme: {
        palette: "this-palette-does-not-exist",
      },
      settingsTheme: {
        palette: "also-unknown",
      },
      prefersDarkMode: false,
    });

    expect(theme.palette.key).toBe("blue");
    expect(theme.colors.header.bg).toBe(theme.tokens.surface.header);
  });

  it("defaults to system mode and resolves to dark when system prefers dark", () => {
    const theme = resolveWidgetTheme({
      prefersDarkMode: true,
    });

    expect(theme.mode).toBe("system");
    expect(theme.resolvedMode).toBe("dark");
    expect(theme.tokens.surface.panel).toBe("#141A20");
  });
});
