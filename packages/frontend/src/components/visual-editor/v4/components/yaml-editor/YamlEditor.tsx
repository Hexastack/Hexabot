/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Editor, { type Monaco } from "@monaco-editor/react";
import type { IDisposable, editor } from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";
import { IAction } from "@/types/action.types";

import { useWorkflow } from "../../hooks/useWorkflow";

import { registerYamlCompletionProvider } from "./completion";
import {
  DEFAULT_YAML_STATUS_MESSAGE,
  YAML_EDITOR_OPTIONS,
  YAML_VALIDATION_DEBOUNCE_MS,
  YAML_WORKFLOW_VALIDATION_OWNER,
} from "./constants";
import { ensureYamlLanguageService } from "./language";
import { applyYamlMarkers } from "./markers";
import type { YamlEditorProps } from "./types";
import { applyWorkflowValidationMarkers } from "./validation/validation";
import "./yaml.worker";

export function YamlEditor({ errorLine, errorMessage }: YamlEditorProps) {
  const {
    data: actions = [],
    isLoading: actionsLoading,
    isError: actionsError,
  } = useFind({ entity: EntityType.WORKFLOW_ACTIONS }, { hasCount: false });
  const { yaml, setYaml } = useWorkflow();
  const availableActions = actionsLoading || actionsError ? undefined : actions;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionDisposableRef = useRef<IDisposable | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);
  const handleChange = useCallback(
    (nextValue?: string) => {
      setYaml(nextValue || "");
    },
    [setYaml],
  );
  const applyMarkers = useCallback(() => {
    applyYamlMarkers({
      editorInstance: editorRef.current,
      monacoInstance: monacoRef.current,
      errorLine,
      errorMessage,
    });
  }, [errorLine, errorMessage]);
  const disposeCompletion = useCallback(() => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = null;
  }, []);
  const registerCompletion = useCallback(
    (monacoInstance: Monaco, nextActions?: IAction[]) => {
      disposeCompletion();

      completionDisposableRef.current = registerYamlCompletionProvider(
        monacoInstance,
        () => nextActions,
      );
    },
    [disposeCompletion],
  );
  const applyWorkflowValidation = useCallback(() => {
    applyWorkflowValidationMarkers({
      editorInstance: editorRef.current,
      monacoInstance: monacoRef.current,
      yaml,
      actions: actionsLoading || actionsError ? undefined : actions,
    });
  }, [actions, actionsError, actionsLoading, yaml]);
  const handleBeforeMount = useCallback((monacoInstance: Monaco) => {
    ensureYamlLanguageService(monacoInstance);
  }, []);
  const handleMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;
      registerCompletion(monacoInstance, availableActions);
      applyMarkers();
      applyWorkflowValidation();
    },
    [
      applyMarkers,
      applyWorkflowValidation,
      availableActions,
      registerCompletion,
    ],
  );

  useEffect(() => {
    applyMarkers();
  }, [applyMarkers]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    if (validationTimeoutRef.current) {
      window.clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = window.setTimeout(() => {
      applyWorkflowValidation();
      validationTimeoutRef.current = null;
    }, YAML_VALIDATION_DEBOUNCE_MS);

    return () => {
      if (validationTimeoutRef.current) {
        window.clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, [applyWorkflowValidation]);

  useEffect(() => {
    return () => {
      disposeCompletion();
    };
  }, [disposeCompletion]);

  useEffect(() => {
    if (!monacoRef.current) {
      return;
    }

    registerCompletion(monacoRef.current, availableActions);
  }, [availableActions, registerCompletion]);

  useEffect(() => {
    return () => {
      if (!editorRef.current || !monacoRef.current) return;
      const model = editorRef.current.getModel();

      if (!model) return;

      monacoRef.current.editor.setModelMarkers(
        model,
        YAML_WORKFLOW_VALIDATION_OWNER,
        [],
      );
    };
  }, []);

  return (
    <div className="yaml-editor nokey">
      <div className="yaml-editor__body">
        <Editor
          value={yaml}
          onChange={handleChange}
          defaultLanguage="yaml"
          beforeMount={handleBeforeMount}
          theme="light"
          height="100%"
          width="100%"
          onMount={handleMount}
          options={YAML_EDITOR_OPTIONS}
        />
      </div>
      <div className="yaml-editor__header">
        {errorLine && (
          <div className="yaml-editor__error-indicator">
            Line {errorLine}: {errorMessage ?? DEFAULT_YAML_STATUS_MESSAGE}
          </div>
        )}
      </div>
    </div>
  );
}
