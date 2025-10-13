const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const headerPlugin = require('eslint-plugin-header');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

if (!headerPlugin.rules.header.meta.schema) {
  headerPlugin.rules.header.meta.schema = {
    type: 'array',
  };
}

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const createConfig = ({ headerYear = '2025' } = {}) => {
  const headerLines = [
    '',
    ' * Hexabot — Fair Core License (FCL-1.0-ALv2)',
    {
      pattern: '^ \\* Copyright \\(c\\) 20\\d{2} Hexastack\\.$',
      template: ` * Copyright (c) ${headerYear} Hexastack.`,
    },
    ' * Full terms: see LICENSE.md.',
    ' ',
  ];

  return [
    {
      ignores: ['dist', 'eslint.config.cjs', 'eslint.config-staged.cjs'],
    },
    {
      linterOptions: {
        reportUnusedDisableDirectives: 'off',
      },
    },
    js.configs.recommended,
    ...compat.extends(
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:@typescript-eslint/recommended',
    ),
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
          },
        },
        globals: {
          ...globals.browser,
          ...globals.node,
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        import: importPlugin,
        header: headerPlugin,
        react: reactPlugin,
        'react-hooks': reactHooksPlugin,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
        '@typescript-eslint/no-unused-expressions': [
          'error',
          {
            allowShortCircuit: true,
            allowTaggedTemplates: true,
            allowTernary: true,
          },
        ],
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        'import/newline-after-import': 'error',
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'unknown',
              'index',
              'internal',
              'parent',
              'sibling',
            ],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
          },
        ],
        'newline-after-var': 'error',
        'newline-before-return': 'error',
        'no-console': 'error',
        'no-duplicate-imports': 'error',
        'object-shorthand': 'error',
        'prefer-const': 'off',
        'padding-line-between-statements': [
          'error',
          { blankLine: 'never', prev: ['const'], next: 'const' },
        ],
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/jsx-curly-brace-presence': 'warn',
        'react/self-closing-comp': 'error',
        'react-hooks/exhaustive-deps': 'off',
        'react-hooks/purity': 'off',
        'react-hooks/refs': 'off',
        'react-hooks/incompatible-library': 'off',
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/unsupported-syntax': 'off',
        'react-hooks/preserve-manual-memoization': 'off',
        'react-hooks/immutability': 'off',
        'react-hooks/static-components': 'off',
        'header/header': [2, 'block', headerLines, 2],
        'no-multiple-empty-lines': ['error', { max: 1 }],
        'no-extra-boolean-cast': 'off',
        'no-unsafe-optional-chaining': 'off',
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
  ];
};

const config = createConfig();

config.createConfig = createConfig;

module.exports = config;
