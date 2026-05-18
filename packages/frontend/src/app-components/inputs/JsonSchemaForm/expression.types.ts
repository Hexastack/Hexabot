/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type ExpressionPolicy = "input-default" | "opt-in" | "disabled";

export type ExpressionFieldState = {
  hasError: boolean;
  suppressSchemaErrors: boolean;
};

export type ExpressionFormContext = {
  expressionFieldStates?: Record<string, ExpressionFieldState | undefined>;
  expressionPolicy?: ExpressionPolicy;
  reportExpressionFieldState?: (
    fieldId: string,
    state?: ExpressionFieldState,
  ) => void;
};
