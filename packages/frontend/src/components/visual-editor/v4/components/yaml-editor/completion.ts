/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { IDisposable, IPosition, editor } from "monaco-editor";

import type { IAction } from "@/types/action.types";

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
const countIndent = (line: string) => line.match(/^\s*/)?.[0].length ?? 0;
const isCommentOrBlank = (line: string) => {
  const trimmed = line.trim();

  return trimmed.length === 0 || trimmed.startsWith("#");
};
const isInDefsBlock = (model: editor.ITextModel, position: IPosition) => {
  for (let lineNumber = position.lineNumber; lineNumber >= 1; lineNumber -= 1) {
    const line = model.getLineContent(lineNumber);

    if (isCommentOrBlank(line)) continue;

    if (countIndent(line) === 0) {
      return /^defs:\s*(#.*)?$/.test(line.trim());
    }
  }

  return false;
};
const buildTaskCompletionItems = (
  monacoInstance: Monaco,
  model: editor.ITextModel,
  position: IPosition,
  taskIds?: string[],
) => {
  const linePrefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1);

  if (!/(^|\s)do:\s*[^#]*$/.test(linePrefix)) {
    return [];
  }

  if (!taskIds?.length) {
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
const buildActionCompletionItems = (
  monacoInstance: Monaco,
  model: editor.ITextModel,
  position: IPosition,
  actions?: IAction[],
) => {
  if (!actions?.length) {
    return [];
  }

  const lineContent = model.getLineContent(position.lineNumber);

  if (lineContent.trim().startsWith("#")) {
    return [];
  }

  const linePrefix = lineContent.slice(0, position.column - 1);

  if (!/^\s*action:\s*[^#]*$/.test(linePrefix)) {
    return [];
  }

  if (!isInDefsBlock(model, position)) {
    return [];
  }

  const wordInfo = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    startColumn: wordInfo.startColumn,
    endLineNumber: position.lineNumber,
    endColumn: wordInfo.endColumn,
  };
  const seen = new Set<string>();
  const sortedActions = actions
    .filter((action) => {
      if (!action?.name || seen.has(action.name)) {
        return false;
      }

      seen.add(action.name);

      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return sortedActions.map((action) => ({
    label: action.name,
    kind: monacoInstance.languages.CompletionItemKind.Function,
    insertText: action.name,
    range,
    detail: "Workflow action",
    documentation: action.description || undefined,
  }));
};

export const registerYamlCompletionProvider = (
  monacoInstance: Monaco,
  getActions?: () => IAction[] | undefined,
  getTaskIds?: () => string[] | undefined,
): IDisposable => {
  const suggestions = buildYamlCompletionItems(monacoInstance);

  return monacoInstance.languages.registerCompletionItemProvider(
    YAML_LANGUAGE_ID,
    {
      triggerCharacters: [...YAML_COMPLETION_TRIGGER_CHARACTERS],
      provideCompletionItems: (model, position, context) => {
        const taskSuggestions = buildTaskCompletionItems(
          monacoInstance,
          model,
          position,
          getTaskIds?.(),
        );
        const actionSuggestions = buildActionCompletionItems(
          monacoInstance,
          model,
          position,
          getActions?.(),
        );
        const includeBaseSuggestions = context?.triggerCharacter !== ":";

        return {
          suggestions: [
            ...(includeBaseSuggestions ? suggestions : []),
            ...taskSuggestions,
            ...actionSuggestions,
          ],
        };
      },
    },
  );
};
