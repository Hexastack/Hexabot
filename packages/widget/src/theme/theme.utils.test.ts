/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { resolveWidgetTheme } from "./theme.utils";

describe("resolveWidgetTheme", () => {
  it("uses the top-level mode prop over nested and server theme modes", () => {
    const theme = resolveWidgetTheme({
      configMode: "dark",
      configTheme: {
        mode: "light",
      },
      settingsTheme: {
        mode: "light",
      },
      prefersDarkMode: false,
    });

    expect(theme.mode).toBe("dark");
    expect(theme.resolvedMode).toBe("dark");
    expect(theme.palette.primary).toBe("#111827");
  });

  it("uses explicit widget primaryColor over server settings and system preference", () => {
    const theme = resolveWidgetTheme({
      configTheme: {
        mode: "light",
      },
      settingsTheme: {
        mode: "dark",
      },
      primaryColor: "#FF4136",
      prefersDarkMode: true,
    });

    expect(theme.mode).toBe("light");
    expect(theme.resolvedMode).toBe("light");
    expect(theme.palette.primary).toBe("#FF4136");
  });

  it("falls back to a safe default primary color when an invalid value is provided", () => {
    const theme = resolveWidgetTheme({
      primaryColor: "this-is-not-a-color",
      prefersDarkMode: false,
    });

    expect(theme.palette.primary).toBe("#0074D9");
  });

  it("normalizes a valid primaryColor prop and uses it across semantic tokens", () => {
    const theme = resolveWidgetTheme({
      primaryColor: "1ba089",
      prefersDarkMode: false,
    });

    expect(theme.palette.primary).toBe("#1BA089");
    expect(theme.palette.onPrimary).toBe("#FCFCFC");
    expect(theme.tokens.surface.header).toBe("#1BA089");
  });

  it("accepts rgb and hsl primaryColor values", () => {
    const rgbTheme = resolveWidgetTheme({
      primaryColor: "rgb(27, 160, 137)",
      prefersDarkMode: false,
    });
    const hslTheme = resolveWidgetTheme({
      primaryColor: "hsl(174, 63%, 40%)",
      prefersDarkMode: false,
    });

    expect(rgbTheme.palette.primary).toBe("#1BA089");
    expect(hslTheme.palette.primary).toBe("#26A699");
  });

  it("defaults to system mode and resolves to dark when system prefers dark", () => {
    const theme = resolveWidgetTheme({
      prefersDarkMode: true,
    });

    expect(theme.mode).toBe("system");
    expect(theme.resolvedMode).toBe("dark");
    expect(theme.palette.primary).toBe("#111827");
    expect(theme.tokens.surface.panel).toBe("#141A20");
  });
});
