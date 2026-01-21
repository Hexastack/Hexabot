/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Editor from "@monaco-editor/react";

import { DEFAULT_YAML_STATUS_MESSAGE, YAML_EDITOR_OPTIONS } from "./constants";
import type { YamlEditorProps } from "./types";
import { useYamlEditorController } from "./useYamlEditorController";
import "./yaml.worker";

export function YamlEditor({ errorLine, errorMessage }: YamlEditorProps) {
  const { value, onChange, beforeMount, onMount } = useYamlEditorController({ errorLine, errorMessage });

  return (
    <div className="yaml-editor nokey">
      <div className="yaml-editor__body">
        <Editor
          value={value}
          onChange={onChange}
          defaultLanguage="yaml"
          beforeMount={beforeMount}
          theme="light"
          height="100%"
          width="100%"
          onMount={onMount}
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
