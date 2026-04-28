/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import { YAML_VALIDATION_OWNER } from "./constants";

type ApplyYamlMarkersOptions = {
  editorInstance: editor.IStandaloneCodeEditor | null;
  monacoInstance: Monaco | null;
};

export const applyYamlMarkers = ({
  editorInstance,
  monacoInstance,
}: ApplyYamlMarkersOptions) => {
  if (!editorInstance || !monacoInstance) return;
  const model = editorInstance.getModel();

  if (!model) return;
  monacoInstance.editor.setModelMarkers(model, YAML_VALIDATION_OWNER, []);
};
