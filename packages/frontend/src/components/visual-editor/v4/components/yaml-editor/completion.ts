/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { IDisposable } from "monaco-editor";

import {
  YAML_COMPLETION_SUGGESTIONS,
  YAML_COMPLETION_TRIGGER_CHARACTERS,
  YAML_LANGUAGE_ID,
} from "./constants";

const buildYamlCompletionItems = (monacoInstance: Monaco) =>
  YAML_COMPLETION_SUGGESTIONS.map((suggestion) => ({
    ...suggestion,
    kind: monacoInstance.languages.CompletionItemKind.Snippet,
    insertTextRules:
      monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  }));

export const registerYamlCompletionProvider = (
  monacoInstance: Monaco,
): IDisposable => {
  const suggestions = buildYamlCompletionItems(monacoInstance);

  return monacoInstance.languages.registerCompletionItemProvider(
    YAML_LANGUAGE_ID,
    {
      triggerCharacters: [...YAML_COMPLETION_TRIGGER_CHARACTERS],
      provideCompletionItems: () => ({ suggestions }),
    },
  );
};
