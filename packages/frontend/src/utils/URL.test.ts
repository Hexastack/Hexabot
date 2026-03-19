/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { isAbsoluteUrl } from "./URL";

describe("isAbsoluteUrl", () => {
  it("accepts standard http/https URLs by default", () => {
    expect(isAbsoluteUrl("https://mcp.example.com/mcp")).toBe(true);
    expect(isAbsoluteUrl("http://api.example.org/health")).toBe(true);
  });

  it("accepts non-tld hosts by default", () => {
    expect(isAbsoluteUrl("http://127.0.0.1:8000/mcp")).toBe(true);
    expect(isAbsoluteUrl("http://localhost:8000/mcp")).toBe(true);
  });

  it("rejects local hosts when requireTld is enabled", () => {
    expect(
      isAbsoluteUrl("http://127.0.0.1:8000/mcp", { requireTld: true }),
    ).toBe(false);
    expect(
      isAbsoluteUrl("http://localhost:8000/mcp", { requireTld: true }),
    ).toBe(false);
  });

  it("rejects unsupported protocols", () => {
    expect(isAbsoluteUrl("ftp://example.com/file")).toBe(false);
  });
});
