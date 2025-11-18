const path = require('node:path');
const { FlatCompat } = require('@eslint/eslintrc');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const importPlugin = require('eslint-plugin-import');
const headerPlugin = require('eslint-plugin-header');

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
    ...compat.extends('plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'),
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          project: path.join(__dirname, 'tsconfig.json'),
          tsconfigRootDir: __dirname,
          sourceType: 'module',
        },
        globals: {
          ...globals.node,
          fetch: 'readonly',
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        import: importPlugin,
        header: headerPlugin,
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-namespace': 'off',
        'padding-line-between-statements': [
          2,
          { blankLine: 'always', prev: '*', next: 'export' },
          { blankLine: 'always', prev: '*', next: 'function' },
          { blankLine: 'always', prev: '*', next: 'return' },
          { blankLine: 'never', prev: 'const', next: 'const' },
        ],
        'lines-between-class-members': ['warn', 'always'],
        'no-console': 'off',
        'no-duplicate-imports': 2,
        'object-shorthand': 1,
        'import/order': [
          'error',
          {
            groups: ['builtin', 'external', 'unknown', 'parent', 'sibling', 'index', 'internal'],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
          },
        ],
        'header/header': [2, 'block', headerLines, 2],
        'no-multiple-empty-lines': ['error', { max: 1 }],
      },
    },
  ];
};

const config = createConfig();

config.createConfig = createConfig;

module.exports = config;
