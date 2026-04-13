/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import { describe, expect, it, vi } from "vitest";

import { registerYamlCompletionProvider } from "./completion";
import { YAML_LANGUAGE_ID } from "./constants";

type CompletionProvider = Parameters<
  Monaco["languages"]["registerCompletionItemProvider"]
>[1];

const createMonacoMock = () => {
  let provider: CompletionProvider | undefined;

  const monaco = {
    languages: {
      CompletionItemKind: {
        Snippet: 1,
        Reference: 2,
        Function: 3,
      },
      CompletionItemInsertTextRule: {
        InsertAsSnippet: 4,
      },
      registerCompletionItemProvider: vi.fn(
        (languageId, completionProvider) => {
          if (languageId === YAML_LANGUAGE_ID) {
            provider = completionProvider;
          }

          return { dispose: vi.fn() };
        },
      ),
    },
  } as unknown as Monaco;

  return {
    monaco,
    getProvider: () => provider,
  };
};

describe("yaml completion", () => {
  it("suggests task ids from provider state for flow do references", () => {
    const { monaco, getProvider } = createMonacoMock();

    registerYamlCompletionProvider(monaco, undefined, () => ["task_alpha"]);

    const provider = getProvider();

    if (!provider) {
      throw new Error("Expected YAML completion provider to be registered");
    }

    const doLine = "  - do: ";
    const suggestions = provider.provideCompletionItems(
      {
        getLineContent: () => doLine,
        getWordUntilPosition: () => ({
          word: "",
          startColumn: doLine.length + 1,
          endColumn: doLine.length + 1,
        }),
      } as never,
      {
        lineNumber: 9,
        column: doLine.length + 1,
      } as never,
      { triggerCharacter: ":" } as never,
      {} as never,
    ).suggestions;

    expect(suggestions.map((suggestion) => suggestion.label)).toContain(
      "task_alpha",
    );
  });
});
