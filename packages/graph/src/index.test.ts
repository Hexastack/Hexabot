/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { GRAPH_PACKAGE_PLACEHOLDER } from "./index";

describe("@hexabot-ai/graph", () => {
  it("exposes a package placeholder export", () => {
    expect(GRAPH_PACKAGE_PLACEHOLDER).toBe("graph-package-placeholder");
  });
});
