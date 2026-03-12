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
      settings: {
        provider: "openai",
      },
    },
    profile: {
      kind: "memory",
      settings: {
        provider: "redis",
      },
    },
    agent: {
      kind: "task",
      action: "agent_action",
      bindings: {
        model: "openai_chatgpt",
        memory: ["profile"],
        tools: ["search"],
      },
    },
    memory_router: {
      kind: "memory_router",
      settings: {
        strategy: "all",
      },
      bindings: {
        memory: ["profile"],
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
        ownerDefName: "agent",
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
        ownerDefName: "agent",
        bindingKind: "model",
        bindingsByName,
      }),
    ).toEqual([]);
  });

  it("supports disabled refs lookup for non-task owner defs", () => {
    const definition = createDefinition();
    const bindingsByName = createBindingsByName();

    expect(
      getDisabledBindingRefs({
        definition,
        ownerDefName: "memory_router",
        bindingKind: "memory",
        bindingsByName,
      }),
    ).toEqual(["profile"]);
  });

  it("returns an empty list for tools and unknown tasks", () => {
    const definition = createDefinition();
    const bindingsByName = createBindingsByName();

    expect(
      getDisabledBindingRefs({
        definition,
        ownerDefName: "agent",
        bindingKind: "tools",
        bindingsByName,
      }),
    ).toEqual([]);
    expect(
      getDisabledBindingRefs({
        definition,
        ownerDefName: "unknown",
        bindingKind: "memory",
        bindingsByName,
      }),
    ).toEqual([]);
  });
});
