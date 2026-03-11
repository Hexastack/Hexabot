/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import { describe, expect, it } from "vitest";

import type { WorkflowBindingDefinition } from "@/contexts/workflow-bindings.context";

import {
  getDisabledBindingRefs,
  isNonToolBindingKind,
} from "./workflow-binding-routing.utils";

const createBindingsByName = () =>
  new Map<string, WorkflowBindingDefinition>([
    ["tools", { schema: {}, multiple: true }],
    ["model", { schema: {}, multiple: false }],
    ["memory", { schema: {}, multiple: true }],
  ]);
const createDefinition = (): WorkflowDefinition => ({
  defs: {
    openai_chatgpt: {
      kind: "model",
      provider: "openai",
    },
    profile: {
      kind: "memory",
      provider: "redis",
    },
  },
  tasks: {
    agent: {
      action: "agent_action",
      bindings: {
        model: "openai_chatgpt",
        memory: ["profile"],
        tools: ["search"],
      },
    },
  },
  flow: [{ do: "agent" }],
  outputs: {
    result: "=$output.agent",
  },
});

describe("workflow-binding-routing.utils", () => {
  it("recognizes non-tool binding kinds from the catalog", () => {
    const bindingsByName = createBindingsByName();

    expect(isNonToolBindingKind("model", bindingsByName)).toBe(true);
    expect(isNonToolBindingKind("memory", bindingsByName)).toBe(true);
    expect(isNonToolBindingKind("tools", bindingsByName)).toBe(false);
    expect(isNonToolBindingKind("unknown", bindingsByName)).toBe(false);
  });

  it("returns mounted refs as disabled for multiple non-tool kinds", () => {
    const definition = createDefinition();
    const bindingsByName = createBindingsByName();

    expect(
      getDisabledBindingRefs({
        definition,
        taskName: "agent",
        bindingKind: "memory",
        bindingsByName,
      }),
    ).toEqual(["profile"]);
  });

  it("returns an empty list for single non-tool kinds", () => {
    const definition = createDefinition();
    const bindingsByName = createBindingsByName();

    expect(
      getDisabledBindingRefs({
        definition,
        taskName: "agent",
        bindingKind: "model",
        bindingsByName,
      }),
    ).toEqual([]);
  });

  it("returns an empty list for tools and unknown tasks", () => {
    const definition = createDefinition();
    const bindingsByName = createBindingsByName();

    expect(
      getDisabledBindingRefs({
        definition,
        taskName: "agent",
        bindingKind: "tools",
        bindingsByName,
      }),
    ).toEqual([]);
    expect(
      getDisabledBindingRefs({
        definition,
        taskName: "unknown",
        bindingKind: "memory",
        bindingsByName,
      }),
    ).toEqual([]);
  });
});
