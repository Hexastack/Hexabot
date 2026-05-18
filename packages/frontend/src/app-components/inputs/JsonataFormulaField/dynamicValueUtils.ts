/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import jsonata from "jsonata";

export type DynamicValueValidationCode = "empty_dynamic" | "invalid_dynamic";

export type DynamicValueValidationResult = {
  code: DynamicValueValidationCode | null;
  errorMessage?: string;
  isExpression: boolean;
  suppressSchemaErrors: boolean;
};

export const isExpressionValue = (value: string) => value.startsWith("=");

export const stripExpressionPrefix = (value: string) =>
  isExpressionValue(value) ? value.slice(1) : value;

export const ensureExpressionPrefix = (value: string) =>
  isExpressionValue(value) ? value : `=${value}`;

const ROOTED_SCOPE_PATH_PATTERN =
  /(?:^|[^\w$])(?:\$input|\$output|\$context)(?:\.(?:[A-Za-z_$][A-Za-z0-9_$]*|"[^"\\]*(?:\\.[^"\\]*)*"))*$/;
const EXPRESSION_BODY_HINT_PATTERN =
  /^(?:(?:\$input|\$output|\$context)(?:$|[\s.[({])|\$[A-Za-z_][A-Za-z0-9_]*\s*\()/;

export const shouldAppendCompletionDot = (textBeforeCursor: string) => {
  const trimmedText = textBeforeCursor.trimEnd();

  return (
    trimmedText.length > 0 &&
    !trimmedText.endsWith(".") &&
    ROOTED_SCOPE_PATH_PATTERN.test(trimmedText)
  );
};

export const looksLikeDynamicValueExpressionBody = (value: string) =>
  EXPRESSION_BODY_HINT_PATTERN.test(value.trim());

export const toJsonataStringLiteral = (value: string) =>
  `=${JSON.stringify(value)}`;

export const validateDynamicValue = (
  value: string,
): DynamicValueValidationResult => {
  if (!isExpressionValue(value)) {
    return {
      code: null,
      isExpression: false,
      suppressSchemaErrors: false,
    };
  }

  const expressionBody = stripExpressionPrefix(value);

  if (!expressionBody.trim()) {
    return {
      code: "empty_dynamic",
      isExpression: true,
      suppressSchemaErrors: false,
    };
  }

  try {
    jsonata(expressionBody);

    return {
      code: null,
      isExpression: true,
      suppressSchemaErrors: true,
    };
  } catch (error) {
    return {
      code: "invalid_dynamic",
      errorMessage: error instanceof Error ? error.message : undefined,
      isExpression: true,
      suppressSchemaErrors: false,
    };
  }
};
