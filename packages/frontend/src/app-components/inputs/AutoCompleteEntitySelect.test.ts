/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { buildAutoCompleteEntityWhere } from "./auto-complete-entity-select.utils";

describe("buildAutoCompleteEntityWhere", () => {
  it("merges static where filters with search clauses", () => {
    expect(
      buildAutoCompleteEntityWhere({
        where: { state: true },
        searchOrClauses: [{ name: { contains: "web" } }],
      }),
    ).toEqual({
      state: true,
      or: [{ name: { contains: "web" } }],
    });
  });

  it("returns static where filters when search is empty", () => {
    expect(
      buildAutoCompleteEntityWhere({
        where: { state: true },
        searchOrClauses: [],
      }),
    ).toEqual({
      state: true,
    });
  });
});
