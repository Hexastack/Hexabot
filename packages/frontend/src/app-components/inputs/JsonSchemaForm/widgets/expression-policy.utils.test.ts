/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { resolveAllowExpression } from "./expression-policy.utils";

describe("expression policy utils", () => {
  it("allows expressions by default for action input forms", () => {
    expect(
      resolveAllowExpression({
        schema: { type: "string" },
        options: {},
        policy: "input-default",
      }),
    ).toBe(true);
  });

  it("requires explicit opt-in for settings-style forms", () => {
    expect(
      resolveAllowExpression({
        schema: { type: "string" },
        options: {},
        policy: "opt-in",
      }),
    ).toBe(false);
    expect(
      resolveAllowExpression({
        schema: { type: "string" },
        options: { allowExpression: true },
        policy: "opt-in",
      }),
    ).toBe(true);
  });

  it("respects explicit opt-out on input fields", () => {
    expect(
      resolveAllowExpression({
        schema: { type: "string" },
        options: { allowExpression: false },
        policy: "input-default",
      }),
    ).toBe(false);
  });

  it("never allows expressions for unsafe field shapes", () => {
    expect(
      resolveAllowExpression({
        schema: { type: "string", writeOnly: true },
        options: { allowExpression: true },
        policy: "input-default",
      }),
    ).toBe(false);
    expect(
      resolveAllowExpression({
        schema: { type: "string" },
        options: { entity: "Credential", allowExpression: true },
        policy: "input-default",
      }),
    ).toBe(false);
  });
});
