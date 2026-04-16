/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Editor from "@monaco-editor/react";
import { useColorScheme } from "@mui/material";
import * as React from "react";

import { handleEditorWillMount } from "./JsonataFormulaField/monaco";

export type JsonViewerProps = {
  value: unknown;
};

const JSON_VIEWER_OPTIONS = {
  readOnly: true,
  domReadOnly: true,
  automaticLayout: true,
  minimap: { enabled: false },
  scrollbar: {
    handleMouseWheel: true,
    alwaysConsumeMouseWheel: false,
  },
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  lineNumbers: "off" as const,
  folding: true,
  renderLineHighlight: "none" as const,
  glyphMargin: false,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 3,
};
const safeJsonStringify = (input: unknown): string => {
  const seen = new WeakSet<object>();

  try {
    const serialized = JSON.stringify(
      input,
      (_key, value) => {
        if (typeof value === "bigint") return value.toString();
        if (typeof value === "function") {
          return `[Function${value.name ? `: ${value.name}` : ""}]`;
        }
        if (value && typeof value === "object") {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }

        return value;
      },
      2,
    );

    return serialized ?? "";
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("JsonViewer Error: ", e);

    return typeof input === "string" ? input : String(input ?? "");
  }
};

export function JsonViewer({ value }: JsonViewerProps) {
  const jsonText = React.useMemo(() => safeJsonStringify(value), [value]);
  const { mode } = useColorScheme();

  return (
    <Editor
      value={jsonText}
      defaultLanguage="json"
      theme={mode}
      height="100%"
      width="100%"
      options={JSON_VIEWER_OPTIONS}
      beforeMount={handleEditorWillMount}
    />
  );
}
