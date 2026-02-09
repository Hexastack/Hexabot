/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import Editor, { OnMount } from "@monaco-editor/react";
import { Box, FormControl, FormHelperText, FormLabel } from "@mui/material";
import { useColorScheme, useTheme } from "@mui/material/styles";
import jsonata from "jsonata";
import * as React from "react";

import { indexToLineCol, toLineHeightPx, toPxValue } from "./jsonataUtils";
import {
  createCompletionProvider,
  handleEditorWillMount,
  registerJsonataLanguage,
} from "./monaco";
import { extractGlobals } from "./schema";
import type { JsonataFormulaFieldProps } from "./types";

export function JsonataFormulaField(props: JsonataFormulaFieldProps) {
  const {
    label,
    required,
    value,
    onChange,
    globalsSchema,
    disabled,
    helperText,
    fullWidth,
    minHeightPx = 36,
    maxHeightPx = 220,
    sx,
  } = props;
  const theme = useTheme();
  const { root, input, output, context } = React.useMemo(
    () => extractGlobals(globalsSchema),
    [globalsSchema],
  );
  const isJsonataMode = value.startsWith("=");
  const monacoRef = React.useRef<typeof import("monaco-editor") | null>(null);
  const editorRef = React.useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null);
  const completionDisposableRef = React.useRef<
    import("monaco-editor").IDisposable | null
  >(null);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [height, setHeight] = React.useState<number>(minHeightPx);
  const prevIsJsonataMode = React.useRef<boolean>(isJsonataMode);
  const editorFontSize = React.useMemo(
    () =>
      toPxValue(
        theme.typography.body1?.fontSize ?? theme.typography.fontSize,
        theme.typography.fontSize,
        theme.typography.htmlFontSize,
      ),
    [theme],
  );
  const editorLineHeight = React.useMemo(
    () =>
      toLineHeightPx(
        theme.typography.body1?.lineHeight,
        editorFontSize,
        theme.typography.htmlFontSize,
      ),
    [editorFontSize, theme],
  );
  const editorPaddingY = React.useMemo(
    () => Number.parseFloat(theme.spacing(1.0625)),
    [theme],
  );

  React.useEffect(() => {
    prevIsJsonataMode.current = isJsonataMode;
  }, [isJsonataMode]);

  const onMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco as any;
    editorRef.current = editor;

    registerJsonataLanguage(monaco as any);

    // Install completion provider (dispose previous if any)
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = createCompletionProvider(
      monaco as any,
      root,
      {
        input,
        output,
        context,
      },
      editor.getModel(),
    );

    // Set initial language based on current value
    const model = editor.getModel();

    if (model) {
      monaco.editor.setModelLanguage(
        model,
        isJsonataMode ? "jsonata" : "plaintext",
      );
    }

    // Auto-size editor height
    const updateHeight = () => {
      const content = Math.min(
        maxHeightPx,
        Math.max(minHeightPx, editor.getContentHeight()),
      );

      setHeight(content);
      editor.layout({ width: editor.getLayoutInfo().width, height: content });
    };

    updateHeight();

    const sub = editor.onDidContentSizeChange(updateHeight);

    // clicking wrapper should focus editor (handled by wrapper onClick)
    return () => {
      sub.dispose();
    };
  };

  // Re-install completion provider if schema changes
  React.useEffect(() => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();

    if (!monaco || !model) return;

    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = createCompletionProvider(
      monaco,
      root,
      {
        input,
        output,
        context,
      },
      model,
    );

    return () => {
      completionDisposableRef.current?.dispose();
      completionDisposableRef.current = null;
    };
  }, [root, input, output, context]);

  // Switch language when the user adds/removes leading '='
  React.useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    if (!monaco || !editor) return;
    const model = editor.getModel();

    if (!model) return;

    monaco.editor.setModelLanguage(
      model,
      isJsonataMode ? "jsonata" : "plaintext",
    );

    // nice UX: when entering jsonata mode, pop suggestions
    const was = prevIsJsonataMode.current;

    if (!was && isJsonataMode) {
      editor.focus();
      editor.trigger("jsonata", "editor.action.triggerSuggest", null);
    }
  }, [isJsonataMode]);

  // Syntax validation (debounced)
  React.useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    if (!monaco || !editor) return;

    const model = editor.getModel();

    if (!model) return;

    const handle = window.setTimeout(() => {
      setInternalError(null);

      // Clear markers in plain mode
      if (!isJsonataMode) {
        monaco.editor.setModelMarkers(model, "jsonata", []);

        return;
      }

      const expr = value.slice(1); // strip leading '='

      if (!expr.trim()) {
        monaco.editor.setModelMarkers(model, "jsonata", []);

        return;
      }

      try {
        // compilation == syntax check
        jsonata(expr);

        monaco.editor.setModelMarkers(model, "jsonata", []);
        setInternalError(null);
      } catch (e: any) {
        const message = e?.message
          ? String(e.message)
          : "Invalid JSONata expression";

        setInternalError(message);

        const posIndex: number =
          typeof e?.position === "number"
            ? e.position
            : typeof e?.offset === "number"
              ? e.offset
              : 0;
        const { line, col } = indexToLineCol(expr, Math.max(0, posIndex));
        // +1 column shift on first line due to the leading '=' in the editor content
        const lineNumber = line + 1;
        const startColumn = col + 1 + (line === 0 ? 1 : 0);
        const endColumn = startColumn + 1;

        monaco.editor.setModelMarkers(model, "jsonata", [
          {
            severity: monaco.MarkerSeverity.Error,
            message,
            startLineNumber: lineNumber,
            startColumn,
            endLineNumber: lineNumber,
            endColumn,
          },
        ]);
      }
    }, 200);

    return () => window.clearTimeout(handle);
  }, [value, isJsonataMode]);

  const showError = Boolean(internalError);
  const { mode } = useColorScheme();

  return (
    <FormControl
      fullWidth={fullWidth}
      disabled={disabled}
      error={showError}
      required={required}
      sx={sx}
      component="fieldset"
      variant="standard"
    >
      {label ? (
        <FormLabel
          sx={{
            mb: 0.5,
            fontSize: 13,
            color: "text.secondary",
            display: "inline-flex",
            alignItems: "center",
            "& .MuiFormLabel-asterisk": {
              order: 2,
            },
            "& .action-field-label-icon": {
              order: 3,
            },
          }}
          required={required}
        >
          {label}
        </FormLabel>
      ) : null}

      <Box
        className="nokey"
        onClick={() => editorRef.current?.focus()}
        sx={(theme) => ({
          border: 1,
          borderColor: showError
            ? theme.palette.error.main
            : theme.palette.divider,
          borderRadius: 1,
          overflow: "hidden",
          px: 1.75,
          backgroundColor: disabled
            ? theme.palette.action.disabledBackground
            : theme.palette.background.paper,
          "&:focus-within": {
            borderColor: showError
              ? theme.palette.error.main
              : theme.palette.primary.main,
          },
        })}
      >
        <Editor
          value={value}
          onChange={(v) => onChange(v ?? "")}
          onMount={onMount}
          theme={mode}
          beforeMount={handleEditorWillMount}
          language={isJsonataMode ? "jsonata" : "plaintext"}
          height={`${height}px`}
          options={{
            readOnly: Boolean(disabled),
            minimap: { enabled: false },
            lineNumbers: "off",
            folding: false,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
              handleMouseWheel: true,
            },
            overviewRulerLanes: 0,
            renderLineHighlight: "none",
            glyphMargin: false,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            tabSize: 2,
            fontFamily: theme.typography.fontFamily,
            fontSize: editorFontSize,
            lineHeight: editorLineHeight,
            fontWeight: String(theme.typography.fontWeightRegular),
            padding: { top: editorPaddingY, bottom: editorPaddingY },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: { enabled: true },
            // Keep spacebar usable when suggestions are open.
            acceptSuggestionOnCommitCharacter: false,
            fixedOverflowWidgets: true,
          }}
        />
      </Box>

      <FormHelperText sx={{ mt: 0.75 }}>
        {showError
          ? internalError
          : (helperText ??
            (isJsonataMode ? "JSONata mode (starts with '=')" : "Plain text"))}
      </FormHelperText>
    </FormControl>
  );
}
