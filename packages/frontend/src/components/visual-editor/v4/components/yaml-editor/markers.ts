/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import {
  DEFAULT_YAML_MARKER_MESSAGE,
  YAML_VALIDATION_OWNER,
} from "./constants";

type ApplyYamlMarkersOptions = {
  editorInstance: editor.IStandaloneCodeEditor | null;
  monacoInstance: Monaco | null;
  errorLine?: number;
  errorMessage?: string;
};

export const applyYamlMarkers = ({
  editorInstance,
  monacoInstance,
  errorLine,
  errorMessage,
}: ApplyYamlMarkersOptions) => {
  if (!editorInstance || !monacoInstance) return;
  const model = editorInstance.getModel();

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
              message: errorMessage ?? DEFAULT_YAML_MARKER_MESSAGE,
              severity: monacoInstance.MarkerSeverity.Error,
            },
          ];
        })()
      : [];

  monacoInstance.editor.setModelMarkers(model, YAML_VALIDATION_OWNER, markers);
};
