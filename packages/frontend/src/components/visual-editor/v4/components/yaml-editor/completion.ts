/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { IDisposable, IPosition, editor } from "monaco-editor";
import { parse as parseYaml } from "yaml";

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
const extractTaskIds = (value: string) => {
  try {
    const parsed = parseYaml(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    const tasks = (parsed as { tasks?: unknown }).tasks;

    if (!tasks || typeof tasks !== "object" || Array.isArray(tasks)) {
      return [];
    }

    return Object.keys(tasks as Record<string, unknown>).sort();
  } catch {
    return [];
  }
};
const buildTaskCompletionItems = (
  monacoInstance: Monaco,
  model: editor.ITextModel,
  position: IPosition,
) => {
  const linePrefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1);

  if (!/(^|\s)do:\s*[^#]*$/.test(linePrefix)) {
    return [];
  }

  const taskIds = extractTaskIds(model.getValue());

  if (taskIds.length === 0) {
    return [];
  }

  const wordInfo = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    startColumn: wordInfo.startColumn,
    endLineNumber: position.lineNumber,
    endColumn: wordInfo.endColumn,
  };

  return taskIds.map((taskId) => ({
    label: taskId,
    kind: monacoInstance.languages.CompletionItemKind.Reference,
    insertText: taskId,
    range,
    detail: "Workflow task",
  }));
};

export const registerYamlCompletionProvider = (
  monacoInstance: Monaco,
): IDisposable => {
  const suggestions = buildYamlCompletionItems(monacoInstance);

  return monacoInstance.languages.registerCompletionItemProvider(
    YAML_LANGUAGE_ID,
    {
      triggerCharacters: [...YAML_COMPLETION_TRIGGER_CHARACTERS],
      provideCompletionItems: (model, position) => ({
        suggestions: [
          ...suggestions,
          ...buildTaskCompletionItems(monacoInstance, model, position),
        ],
      }),
    },
  );
};
