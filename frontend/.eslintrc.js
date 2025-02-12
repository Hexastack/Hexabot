/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
        {
          pattern:
            "^ \\* Copyright © 20\\d{2} Hexastack. All rights reserved.$",
          template: " * Copyright © 2025 Hexastack. All rights reserved.",
        },
        " *",
        " * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:",
        ' * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.',
        ' * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software\'s "About" section, documentation, and README file).',
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
