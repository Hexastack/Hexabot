/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema } from "@rjsf/utils";

import type { ExpressionPolicy } from "../expression.types";

export type { ExpressionPolicy } from "../expression.types";

type ExpressionPolicyOptions = {
  allowExpression?: unknown;
  entity?: unknown;
  inputType?: unknown;
  [key: string]: unknown;
};

const isUnsafeExpressionSchema = (
  schema: RJSFSchema | undefined,
  options: ExpressionPolicyOptions | undefined,
) => {
  const schemaRecord = schema as Record<string, unknown> | undefined;
  const widget = schemaRecord?.["ui:widget"] ?? options?.["ui:widget"];
  const format = schemaRecord?.format;

  return (
    schemaRecord?.writeOnly === true ||
    widget === "PasswordWidget" ||
    widget === "AutoCompleteWidget" ||
    format === "password" ||
    options?.inputType === "password" ||
    typeof options?.entity === "string"
  );
};

export const resolveAllowExpression = ({
  schema,
  options,
  policy,
}: {
  schema?: RJSFSchema;
  options?: ExpressionPolicyOptions;
  policy?: ExpressionPolicy;
}) => {
  if (policy === "disabled" || isUnsafeExpressionSchema(schema, options)) {
    return false;
  }

  if (typeof options?.allowExpression === "boolean") {
    return options.allowExpression;
  }

  return (policy ?? "input-default") === "input-default";
};
