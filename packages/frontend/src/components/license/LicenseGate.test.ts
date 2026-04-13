/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { shouldDisableBlockedChild } from "./LicenseGate";

describe("shouldDisableBlockedChild", () => {
  it("returns true when child is blocked and interactive disabling is enabled", () => {
    expect(
      shouldDisableBlockedChild({
        allowed: false,
        supportsDisabled: true,
        disableChildWhenBlocked: true,
      }),
    ).toBe(true);
  });

  it("returns false when blocked child should remain interactive", () => {
    expect(
      shouldDisableBlockedChild({
        allowed: false,
        supportsDisabled: true,
        disableChildWhenBlocked: false,
      }),
    ).toBe(false);
  });

  it("returns false when access is already allowed", () => {
    expect(
      shouldDisableBlockedChild({
        allowed: true,
        supportsDisabled: true,
        disableChildWhenBlocked: true,
      }),
    ).toBe(false);
  });
});
