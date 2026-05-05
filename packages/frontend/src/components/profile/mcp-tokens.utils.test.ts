/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { McpToken } from "@hexabot-ai/types";
import { describe, expect, it } from "vitest";

import {
  formatOptionalDate,
  getMcpTokenStatus,
  toMcpTokenCreatePayload,
} from "./mcp-tokens.utils";

const baseToken = {
  expiresAt: null,
  revokedAt: null,
} as Pick<McpToken, "expiresAt" | "revokedAt">;

describe("mcp token utils", () => {
  describe("getMcpTokenStatus", () => {
    it("returns revoked before evaluating expiry", () => {
      expect(
        getMcpTokenStatus(
          {
            ...baseToken,
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
            revokedAt: new Date("2025-01-01T00:00:00.000Z"),
          },
          new Date("2025-06-01T00:00:00.000Z"),
        ),
      ).toBe("revoked");
    });

    it("returns expired when the expiry is in the past", () => {
      expect(
        getMcpTokenStatus(
          {
            ...baseToken,
            expiresAt: new Date("2025-01-01T00:00:00.000Z"),
          },
          new Date("2025-06-01T00:00:00.000Z"),
        ),
      ).toBe("expired");
    });

    it("returns active for non-revoked, non-expired tokens", () => {
      expect(
        getMcpTokenStatus(
          {
            ...baseToken,
            expiresAt: new Date("2026-01-01T00:00:00.000Z"),
          },
          new Date("2025-06-01T00:00:00.000Z"),
        ),
      ).toBe("active");
      expect(getMcpTokenStatus(baseToken)).toBe("active");
    });
  });

  it("trims token names and converts datetime-local values to ISO", () => {
    expect(
      toMcpTokenCreatePayload({
        name: "  Codex  ",
        expiresAt: "2026-05-05T12:30",
      }),
    ).toEqual({
      name: "Codex",
      expiresAt: new Date("2026-05-05T12:30").toISOString(),
    });
  });

  it("uses null expiry when no datetime-local value is provided", () => {
    expect(toMcpTokenCreatePayload({ name: "Codex" })).toEqual({
      name: "Codex",
      expiresAt: null,
    });
  });

  it("formats valid dates and ignores empty or invalid dates", () => {
    expect(formatOptionalDate(null)).toBeNull();
    expect(formatOptionalDate("not-a-date")).toBeNull();
    expect(formatOptionalDate("2026-05-05T12:30:00.000Z", "en-US")).toContain(
      "2026",
    );
  });
});
