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
import { useDebouncedEffect } from "./useDebouncedEffect";
import { applyWorkflowValidationMarkers } from "./validation/validation";

export function useYamlEditorController({ errorLine, errorMessage }: Pick<YamlEditorProps, "errorLine" | "errorMessage">) {
  const { yaml, updateDefinitionState, workflow } = useWorkflow();
  const {
    data: actions = [],
    isLoading: actionsLoading,
    isError: actionsError,
  } = useFind(
    { entity: EntityType.WORKFLOW_ACTIONS },
    { hasCount: false },
    {
      routeParams: workflow?.type ? { type: workflow?.type } : undefined,
      enabled: !!workflow?.type,
    },
  );
  const availableActions = actionsLoading || actionsError ? undefined : actions;
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const completionDisposableRef = useRef<IDisposable | null>(null);
  const onChange = useCallback(
    (nextValue?: string) => {
      updateDefinitionState(nextValue || "");
    },
    [updateDefinitionState],
  );
  // Consolidated marker + validation application
  const applyAllMarkers = useCallback(() => {
    applyYamlMarkers({
      editorInstance: editorRef.current,
      monacoInstance: monacoRef.current,
      errorLine,
      errorMessage,
    });

    applyWorkflowValidationMarkers({
      editorInstance: editorRef.current,
      monacoInstance: monacoRef.current,
      yaml,
      actions: availableActions,
    });
  }, [errorLine, errorMessage, yaml, availableActions]);
  const beforeMount = useCallback((monacoInstance: Monaco) => {
    ensureYamlLanguageService(monacoInstance);
  }, []);
  const onMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
      editorRef.current = editorInstance;
      monacoRef.current = monacoInstance;
      applyAllMarkers();
    },
    [applyAllMarkers],
  );

  useEffect(() => {
    applyAllMarkers();
  }, [applyAllMarkers]);

  useDebouncedEffect(
    () => {
      if (!editorRef.current || !monacoRef.current) return;

      applyAllMarkers();
    },
    [applyAllMarkers],
    YAML_VALIDATION_DEBOUNCE_MS,
  );

  useEffect(() => {
    const monaco = monacoRef.current;

    if (!monaco) return;

    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = registerYamlCompletionProvider(monaco, () => availableActions);

    return () => {
      completionDisposableRef.current?.dispose();
      completionDisposableRef.current = null;
    };
    // we only want to re-run when `availableActions` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableActions]);

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
  };
}
