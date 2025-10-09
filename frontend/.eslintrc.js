/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

module.exports = {
  root: true,
  plugins: ["@typescript-eslint/eslint-plugin", "import", "header"],
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "import/newline-after-import": "error",
    "import/order": [
      "error",
      {
        groups: [
          "builtin", // Built-in imports (come from NodeJS native) go first
          "external", // <- External imports
          "unknown", // <- unknown
          "index", // <- index imports
          "internal", // <- Absolute imports
          "parent", // <- Relative imports, the sibling and parent types they can be mingled together
          "sibling",
        ],
        "newlines-between": "always",
        alphabetize: {
          /* sort in ascending order. Options: ["ignore", "asc", "desc"] */
          order: "asc",
          /* ignore case. Options: [true, false] */
          caseInsensitive: true,
        },
      },
    ],
    "newline-after-var": "error",
    "newline-before-return": "error",
    "no-console": "error",
    "no-duplicate-imports": "error",
    "object-shorthand": "error",
    "padding-line-between-statements": [
      "error",
      { blankLine: "never", prev: ["const"], next: "const" },
    ],
    "react/jsx-curly-brace-presence": "warn",
    "react/self-closing-comp": "error",
    "header/header": [
      2,
      "block",
      [
        "",
        " * Hexabot — Fair Core License (FCL-1.0-ALv2)",
        {
          pattern: "^ \\* Copyright \\(c\\) 20\\d{2} Hexastack\\.$",
          template: " * Copyright (c) 2025 Hexastack.",
        },
        " * Full terms: see LICENSE.md.",
        " ",
      ],
      2,
    ],
    "no-multiple-empty-lines": ["error", { max: 1 }],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
