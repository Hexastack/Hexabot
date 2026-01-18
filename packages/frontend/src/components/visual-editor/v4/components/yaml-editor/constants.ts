/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { editor } from "monaco-editor";

import type { YamlCompletionSuggestion } from "./types";

export const YAML_LANGUAGE_ID = "yaml";
export const YAML_VALIDATION_OWNER = "yaml-validation";
export const YAML_WORKFLOW_VALIDATION_OWNER = "yaml-workflow-validation";
export const YAML_VALIDATION_DEBOUNCE_MS = 300;
export const DEFAULT_YAML_MARKER_MESSAGE = "YAML parsing error on this line.";
export const DEFAULT_YAML_STATUS_MESSAGE = "Fix YAML syntax.";

export const YAML_COMPLETION_TRIGGER_CHARACTERS = ["-", " ", "\n"] as const;

export const YAML_COMPLETION_SUGGESTIONS: YamlCompletionSuggestion[] = [
  {
    label: "workflow block",
    insertText:
      "workflow:\n  name: ${1:My workflow}\n  description: ${2:Describe the flow}",
    documentation: "Add workflow metadata fields",
  },
  {
    label: "task definition",
    insertText:
      "tasks:\n  ${1:task_id}:\n    description: ${2:Describe the task}\n",
    documentation: "Start a tasks map with a single entry",
  },
  {
    label: "do step",
    insertText: "- do: ${1:task_id}",
    documentation: "Insert a basic flow step referencing a task",
  },
  {
    label: "parallel block",
    insertText: [
      "- parallel:",
      "    steps:",
      "      - do: ${1:first_task}",
      "      - do: ${2:second_task}",
    ].join("\n"),
    documentation: "Template for running multiple steps in parallel",
  },
  {
    label: "conditional block",
    insertText: [
      "- conditional:",
      "    when:",
      "      - name: ${1:condition_name}",
      "        steps:",
      "          - do: ${2:task_if_true}",
      "    else:",
      "      steps:",
      "        - do: ${3:task_if_false}",
    ].join("\n"),
    documentation: "Template for branching conditional logic",
  },
];

export const YAML_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions =
  {
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    smoothScrolling: true,
    wordWrap: "on",
    tabSize: 2,
    insertSpaces: true,
    renderLineHighlight: "line",
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
  };
