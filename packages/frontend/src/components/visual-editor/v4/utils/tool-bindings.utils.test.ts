/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { WorkflowDefinition } from "@hexabot-ai/agentic";
import { describe, expect, it } from "vitest";

import {
  createUniqueBindingName,
  normalizeBindingName,
} from "./binding-name.utils";
import {
  createToolBindingDefinitionMutation,
  updateToolBindingDefinitionMutation,
} from "./tool-bindings.utils";

const createDefinition = (): WorkflowDefinition => ({
  defs: {
    search: {
      kind: "tools",
      action: "search_web",
      description: "Search",
      settings: { timeout: 10 },
    },
  },
  tasks: {
    ai_generate_reply: {
      action: "ai_generate_reply",
      bindings: {
        tools: ["search"],
      },
    },
    summarize: {
      action: "ai_summarize",
      bindings: {
        tools: ["search"],
      },
    },
  },
  flow: [{ do: "ai_generate_reply" }, { do: "summarize" }],
  outputs: {
    result: "=$output.summarize",
  },
});

describe("tool-bindings.utils", () => {
  it("creates a tool def and mounts it on the target task bindings", () => {
    const definition = createDefinition();
    const nextDefinition = createToolBindingDefinitionMutation(definition, {
      taskName: "ai_generate_reply",
      bindingKind: "tools",
      bindingName: "calculate",
      actionName: "calculate_score",
      description: "Calculator",
      settings: { multiplier: 2, bias: 1 },
    });

    expect(nextDefinition.defs?.calculate).toEqual({
      kind: "tools",
      action: "calculate_score",
      description: "Calculator",
      settings: { multiplier: 2, bias: 1 },
    });
    expect(nextDefinition.tasks.ai_generate_reply.bindings?.tools).toEqual([
      "search",
      "calculate",
    ]);
  });

  it("creates unique default tool names from action names", () => {
    const definition = createDefinition();

    expect(
      createUniqueBindingName(
        normalizeBindingName("search") || "tool",
        definition.defs,
      ),
    ).toBe("search_2");
    expect(
      createUniqueBindingName(
        normalizeBindingName("Calculate Score") || "tool",
        definition.defs,
      ),
    ).toBe("calculate_score");
  });

  it("updates an existing tool settings and description", () => {
    const definition = createDefinition();
    const nextDefinition = updateToolBindingDefinitionMutation(definition, {
      taskName: "ai_generate_reply",
      bindingKind: "tools",
      currentBindingName: "search",
      nextBindingName: "search",
      actionName: "search_web",
      description: "Web Search",
      settings: { timeout: 25 },
    });

    expect(nextDefinition.defs?.search).toEqual({
      kind: "tools",
      action: "search_web",
      description: "Web Search",
      settings: { timeout: 25 },
    });
  });

  it("renames tool defs and updates mounted refs across all tasks", () => {
    const definition = createDefinition();
    const nextDefinition = updateToolBindingDefinitionMutation(definition, {
      taskName: "ai_generate_reply",
      bindingKind: "tools",
      currentBindingName: "search",
      nextBindingName: "search_tool",
      actionName: "search_web",
      description: "Search tool",
      settings: { timeout: 50 },
    });

    expect(nextDefinition.defs?.search).toBeUndefined();
    expect(nextDefinition.defs?.search_tool).toEqual({
      kind: "tools",
      action: "search_web",
      description: "Search tool",
      settings: { timeout: 50 },
    });
    expect(nextDefinition.tasks.ai_generate_reply.bindings?.tools).toEqual([
      "search_tool",
    ]);
    expect(nextDefinition.tasks.summarize.bindings?.tools).toEqual(["search_tool"]);
  });

  it("strips empty optional fields on create and update", () => {
    const definition = createDefinition();
    const withNewTool = createToolBindingDefinitionMutation(definition, {
      taskName: "ai_generate_reply",
      bindingKind: "tools",
      bindingName: "translate",
      actionName: "translate_text",
      description: "   ",
      settings: {},
    });

    expect(withNewTool.defs?.translate).toEqual({
      kind: "tools",
      action: "translate_text",
    });

    const updated = updateToolBindingDefinitionMutation(withNewTool, {
      taskName: "ai_generate_reply",
      bindingKind: "tools",
      currentBindingName: "search",
      nextBindingName: "search",
      actionName: "search_web",
      description: "",
      settings: {},
    });

    expect(updated.defs?.search).toEqual({
      kind: "tools",
      action: "search_web",
    });
  });
});
