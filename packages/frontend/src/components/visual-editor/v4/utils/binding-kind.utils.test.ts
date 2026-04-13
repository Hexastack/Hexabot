/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { describe, expect, it } from "vitest";

import type { WorkflowBindingDefinition } from "@/contexts/workflow-bindings.context";

import { humanizeBindingKind, isSingleBindingKind } from "./binding-kind.utils";

describe("binding-kind.utils", () => {
  it("humanizes snake_case and kebab-case binding kinds", () => {
    expect(humanizeBindingKind("model")).toBe("Model");
    expect(humanizeBindingKind("knowledge_base")).toBe("Knowledge Base");
    expect(humanizeBindingKind("knowledge-base")).toBe("Knowledge Base");
  });

  it("returns a generic fallback for empty binding kind", () => {
    expect(humanizeBindingKind("")).toBe("Binding");
  });

  it("detects single binding kinds from the bindings catalog", () => {
    const bindingsByName = new Map<string, WorkflowBindingDefinition>([
      ["model", { schema: {}, multiple: false }],
      ["tools", { schema: {}, multiple: true }],
    ]);

    expect(isSingleBindingKind("model", bindingsByName)).toBe(true);
    expect(isSingleBindingKind("tools", bindingsByName)).toBe(false);
    expect(isSingleBindingKind("unknown", bindingsByName)).toBe(false);
  });
});
