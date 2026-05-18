/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FormControl } from "@mui/material";
import {
  getTemplate,
  getUiOptions,
  type FieldTemplateProps,
} from "@rjsf/utils";
import { useEffect } from "react";

import type { ExpressionFormContext } from "../expression.types";

import { isActionFieldHidden } from "./action-field-template.utils";

export const ActionFieldTemplate = (props: FieldTemplateProps) => {
  const {
    id,
    children,
    classNames,
    style,
    disabled,
    displayLabel,
    hidden,
    label,
    onKeyRename,
    onKeyRenameBlur,
    onRemoveProperty,
    readonly,
    required,
    rawErrors = [],
    errors,
    help,
    rawDescription,
    schema,
    uiSchema,
    registry,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const rootFormData = registry.formContext?.formData as
    | Record<string, unknown>
    | undefined;
  const expressionFieldState = (
    registry.formContext as ExpressionFormContext | undefined
  )?.expressionFieldStates?.[id];
  const shouldIgnoreErrors =
    expressionFieldState?.suppressSchemaErrors === true &&
    expressionFieldState?.hasError !== true;
  const reportFieldVisibleError = registry.formContext
    ?.reportFieldVisibleError as
    | ((fieldId: string, hasVisibleError: boolean) => void)
    | undefined;
  const isHidden = isActionFieldHidden({
    hidden,
    uiOptions,
    formData: rootFormData,
  });
  const hasSchemaVisibleError =
    !isHidden && !shouldIgnoreErrors && rawErrors.length > 0;
  const hasExpressionVisibleError =
    !isHidden && expressionFieldState?.hasError === true;
  const hasVisibleError = hasSchemaVisibleError || hasExpressionVisibleError;
  const WrapIfAdditionalTemplate = getTemplate(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions,
  );

  useEffect(() => {
    reportFieldVisibleError?.(id, hasVisibleError);

    return () => {
      reportFieldVisibleError?.(id, false);
    };
  }, [hasVisibleError, id, reportFieldVisibleError]);

  if (isHidden) {
    return <div style={{ display: "none" }}>{children}</div>;
  }

  return (
    <WrapIfAdditionalTemplate
      classNames={classNames}
      style={style}
      disabled={disabled}
      id={id}
      label={label}
      displayLabel={displayLabel}
      rawDescription={rawDescription}
      onKeyRename={onKeyRename}
      onKeyRenameBlur={onKeyRenameBlur}
      onRemoveProperty={onRemoveProperty}
      readonly={readonly}
      required={required}
      schema={schema}
      uiSchema={uiSchema}
      registry={registry}
    >
      <FormControl fullWidth error={hasVisibleError} required={required}>
        {children}
        {hasSchemaVisibleError ? errors : null}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
};
