/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { formatSegmentForJsonata } from "./jsonataUtils";
import {
  deref,
  getItemsSchema,
  getPropertyKeys,
  getPropertySchema,
  schemaTypeHas,
} from "./schema";
import type { JsonSchemaLike } from "./types";

let JSONATA_LANG_REGISTERED = false;

export function registerJsonataLanguage(monaco: typeof import("monaco-editor")) {
  if (JSONATA_LANG_REGISTERED) return;
  JSONATA_LANG_REGISTERED = true;

  monaco.languages.register({ id: "jsonata" });

  monaco.languages.setMonarchTokensProvider("jsonata", {
    defaultToken: "",
    tokenPostfix: ".jsonata",
    brackets: [
      { open: "{", close: "}", token: "delimiter.curly" },
      { open: "[", close: "]", token: "delimiter.square" },
      { open: "(", close: ")", token: "delimiter.parenthesis" },
    ],
    tokenizer: {
      root: [
        // strings
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string_double"],

        [/'([^'\\]|\\.)*$/, "string.invalid"],
        [/'/, "string", "@string_single"],

        // numbers
        [/\b\d+(\.\d+)?\b/, "number"],

        // variables / functions starting with $
        [/\$[A-Za-z_][A-Za-z0-9_]*/, "variable"],

        // operators
        [/[+\-*/%]=?/, "operator"],
        [/==|!=|<=|>=|=|<|>/, "operator"],
        [/\?:|:=|~>|\.\./, "operator"],

        // booleans/null
        [/\b(true|false|null)\b/, "constant"],

        // identifiers (field names)
        [/[A-Za-z_][A-Za-z0-9_]*/, "identifier"],

        // delimiters
        [/[.,;]/, "delimiter"],
        [/[{}()[\]]/, "@brackets"],

        // whitespace
        [/\s+/, "white"],
      ],

      string_double: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],

      string_single: [
        [/[^\\']+/, "string"],
        [/\\./, "string.escape"],
        [/'/, "string", "@pop"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration("jsonata", {
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}

export function createCompletionProvider(
  monaco: typeof import("monaco-editor"),
  rootSchema: JsonSchemaLike,
  globals: { input?: JsonSchemaLike; output?: JsonSchemaLike; context?: JsonSchemaLike },
  targetModel?: import("monaco-editor").editor.ITextModel | null
) {
  const varItems: import("monaco-editor").languages.CompletionItem[] = [
    {
      label: "$input",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "$input",
      detail: "Global variable",
      documentation: "Incoming payload / current input",
    },
    {
      label: "$output",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "$output",
      detail: "Global variable",
      documentation: "Output produced so far",
    },
    {
      label: "$context",
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: "$context",
      detail: "Global variable",
      documentation: "Execution context / workflow context",
    },
  ] as any;

  function schemaForVar(v: "$input" | "$output" | "$context") {
    if (v === "$input") return globals.input;
    if (v === "$output") return globals.output;

    return globals.context;
  }

  return monaco.languages.registerCompletionItemProvider("jsonata", {
    triggerCharacters: [".", "$", '"', "'"],
    provideCompletionItems(model, position) {
      if (targetModel && model !== targetModel) {
        return { suggestions: [] };
      }
      const line = model.getLineContent(position.lineNumber);
      const textUntilCursor = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      // Replacement range (include `$` if needed)
      const word = model.getWordUntilPosition(position);
      let startColumn = word.startColumn;
      const charBeforeWord = startColumn > 1 ? line.charAt(startColumn - 2) : "";
      const baseRange = new monaco.Range(
        position.lineNumber,
        startColumn,
        position.lineNumber,
        word.endColumn
      );
      const rangeIncludingDollar =
        charBeforeWord === "$"
          ? new monaco.Range(
              position.lineNumber,
              startColumn - 1,
              position.lineNumber,
              word.endColumn
            )
          : baseRange;
      const suggestions: import("monaco-editor").languages.CompletionItem[] = [];

      // Always allow vars when user is typing `$...`
      if (textUntilCursor.endsWith("$") || charBeforeWord === "$" || word.word.startsWith("$")) {
        suggestions.push(...varItems.map((i) => ({ ...i, range: rangeIncludingDollar })));
      }

      // Context-aware completion: $input.foo.bar.<here>
      const m = /(\$input|\$output|\$context)((?:\.[A-Za-z_$][A-Za-z0-9_$"]*)*)\.?([A-Za-z_$][A-Za-z0-9_$"]*)?$/.exec(
        textUntilCursor
      );

      if (!m) return { suggestions };

      const varName = m[1] as "$input" | "$output" | "$context";
      const dotted = m[2] ?? ""; // like ".user.address"
      const schemaRoot = deref(rootSchema, schemaForVar(varName));

      if (!schemaRoot) return { suggestions };

      const segments = dotted.split(".").filter(Boolean).map((s) => s.replace(/^"|"$/g, ""));
      // Traverse to the node for these segments
      let node: JsonSchemaLike | undefined = schemaRoot;

      for (const seg of segments) {
        node = deref(rootSchema, node);
        if (!node) break;

        // If current is array, properties live under items
        if (schemaTypeHas(node, "array")) {
          node = getItemsSchema(rootSchema, node);
          node = deref(rootSchema, node);
        }
        if (!node) break;

        node = getPropertySchema(rootSchema, node, seg);
      }

      node = deref(rootSchema, node);
      if (!node) return { suggestions };

      // Again: arrays -> items
      if (schemaTypeHas(node, "array")) {
        node = getItemsSchema(rootSchema, node);
        node = deref(rootSchema, node);
      }
      if (!node) return { suggestions };

      const keys = getPropertyKeys(rootSchema, node);
      // If user is right after `$input` with no dot yet, insert a dot automatically
      const needsDot = /(\$input|\$output|\$context)$/.test(textUntilCursor);
      const propertyItems = keys.map((k) => {
        const propSchema = deref(rootSchema, getPropertySchema(rootSchema, node!, k));
        const insert = formatSegmentForJsonata(k);
        const insertText = needsDot ? `.${insert}` : insert;

        return {
          label: k,
          kind: monaco.languages.CompletionItemKind.Field,
          insertText,
          range: baseRange,
          detail: propSchema?.type
            ? `(${Array.isArray(propSchema.type) ? propSchema.type.join(" | ") : propSchema.type})`
            : "field",
          documentation: propSchema?.description,
        } as import("monaco-editor").languages.CompletionItem;
      });

      suggestions.push(...propertyItems);

      return { suggestions };
    },
  });
}
