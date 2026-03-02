/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import { ENodeType, getWorkflowDefaultConfig } from "./index";

describe("@hexabot-ai/graph", () => {
  it("exposes workflow graph utilities", () => {
    const config = getWorkflowDefaultConfig("horizontal");

    expect(config.nodes[ENodeType.AGENT]).toBeDefined();
    expect(config.edges).toBeDefined();
  });
});
