/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { IDisposable, editor } from "monaco-editor";
import { useCallback, useEffect, useRef } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";

import { useWorkflow } from "../../hooks/useWorkflow";

import { registerYamlCompletionProvider } from "./completion";
import {
    YAML_VALIDATION_DEBOUNCE_MS,
    YAML_WORKFLOW_VALIDATION_OWNER,
} from "./constants";
import { ensureYamlLanguageService } from "./language";
import { applyYamlMarkers } from "./markers";
import type { YamlEditorProps } from "./types";
import { applyWorkflowValidationMarkers } from "./validation/validation";

export function useYamlEditorController({ errorLine, errorMessage }: Pick<YamlEditorProps, "errorLine" | "errorMessage">) {
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
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChange = useCallback(
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
  const registerCompletion = useCallback((monacoInstance: Monaco, nextActions?: typeof actions) => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = registerYamlCompletionProvider(monacoInstance, () => nextActions);
  }, []);
  const applyWorkflowValidation = useCallback(() => {
    applyWorkflowValidationMarkers({
      editorInstance: editorRef.current,
      monacoInstance: monacoRef.current,
      yaml,
      actions: availableActions,
    });
  }, [yaml, availableActions]);
  const beforeMount = useCallback((monacoInstance: Monaco) => {
    ensureYamlLanguageService(monacoInstance);
  }, []);
  const onMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;
      registerCompletion(monacoInstance, availableActions);
      applyMarkers();
      applyWorkflowValidation();
    },
    [applyMarkers, applyWorkflowValidation, availableActions, registerCompletion],
  );

  useEffect(() => {
    applyMarkers();
  }, [applyMarkers]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      applyWorkflowValidation();
      validationTimeoutRef.current = null;
    }, YAML_VALIDATION_DEBOUNCE_MS);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
    };
  }, [applyWorkflowValidation]);

  useEffect(() => {
    return () => {
      completionDisposableRef.current?.dispose();
      completionDisposableRef.current = null;
    };
  }, []);

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

      monacoRef.current.editor.setModelMarkers(model, YAML_WORKFLOW_VALIDATION_OWNER, []);
    };
  }, []);

  return {
    value: yaml,
    onChange,
    beforeMount,
    onMount,
    errorLine,
    errorMessage,
  };
}
