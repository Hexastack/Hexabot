/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Editor, { type Monaco } from "@monaco-editor/react";
import type { IDisposable, editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useWorkflow } from "../hooks/useWorkflow";

type YamlEditorProps = {
  errorLine?: number;
  errorMessage?: string;
};

export function YamlEditor({ errorLine, errorMessage }: YamlEditorProps) {
  const { yaml } = useWorkflow();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionDisposableRef = useRef<IDisposable | null>(null);
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (nextValue?: string) => {
      // setText(nextValue ?? "");
    },
    [yaml],
  );
  const applyMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();

    if (!model) return;

    const markers =
      errorLine && errorLine > 0
        ? (() => {
            const safeLineNumber = Math.min(errorLine, model.getLineCount());

            return [
              {
                startLineNumber: safeLineNumber,
                startColumn: 1,
                endLineNumber: safeLineNumber,
                endColumn: model.getLineLength(safeLineNumber) + 1,
                message: errorMessage ?? "YAML parsing error on this line.",
                severity: monacoRef.current.MarkerSeverity.Error,
              },
            ];
          })()
        : [];

    monacoRef.current.editor.setModelMarkers(model, "yaml-validation", markers);
  }, [errorLine, errorMessage]);
  const disposeCompletion = useCallback(() => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = null;
  }, []);
  const registerCompletion = useCallback(
    (monacoInstance: Monaco) => {
      disposeCompletion();

      completionDisposableRef.current =
        monacoInstance.languages.registerCompletionItemProvider("yaml", {
          triggerCharacters: ["-", " ", "\n"],
          provideCompletionItems: () => {
            const suggestions = [
              {
                label: "workflow block",
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText:
                  "workflow:\n  name: ${1:My workflow}\n  description: ${2:Describe the flow}",
                documentation: "Add workflow metadata fields",
              },
              {
                label: "task definition",
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText:
                  "tasks:\n  ${1:task_id}:\n    description: ${2:Describe the task}\n",
                documentation: "Start a tasks map with a single entry",
              },
              {
                label: "do step",
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText: "- do: ${1:task_id}",
                documentation: "Insert a basic flow step referencing a task",
              },
              {
                label: "parallel block",
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                insertText: [
                  "- parallel:",
                  "    steps:",
                  "      - do: ${1:first_task}",
                  "      - do: ${2:second_task}",
                ].join("\n"),
                documentation:
                  "Template for running multiple steps in parallel",
              },
              {
                label: "conditional block",
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
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

            return { suggestions };
          },
        });
    },
    [disposeCompletion],
  );
  const handleMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;
      registerCompletion(monacoInstance);
      applyMarkers();
    },
    [applyMarkers, registerCompletion],
  );

  useEffect(() => {
    applyMarkers();
  }, [applyMarkers]);

  useEffect(() => {
    return () => {
      disposeCompletion();
    };
  }, [disposeCompletion]);

  const editorOptions = useMemo(
    () => ({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      smoothScrolling: true,
      wordWrap: "on" as const,
      tabSize: 2,
      insertSpaces: true,
      renderLineHighlight: "line" as const,
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
    }),
    [],
  );

  return (
    <div className="yaml-editor">
      <div className="yaml-editor__body">
        <Editor
          value={yaml}
          onChange={handleChange}
          defaultLanguage="yaml"
          theme="light"
          height="100%"
          width="100%"
          onMount={handleMount}
          options={editorOptions}
        />
      </div>
      <div className="yaml-editor__header">
        {errorLine && (
          <div className="yaml-editor__error-indicator">
            Line {errorLine}: {errorMessage ?? "Fix YAML syntax."}
          </div>
        )}
      </div>
    </div>
  );
}
