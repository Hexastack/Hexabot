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
    formData,
  } = props;
  const uiOptions = getUiOptions(uiSchema);
  const rootFormData = registry.formContext?.formData as
    | Record<string, unknown>
    | undefined;
  const shouldIgnoreErrors =
    id.startsWith("action-") &&
    typeof formData === "string" &&
    formData.startsWith("=");
  const reportFieldVisibleError = registry.formContext
    ?.reportFieldVisibleError as
    | ((fieldId: string, hasVisibleError: boolean) => void)
    | undefined;
  const isHidden = isActionFieldHidden({
    hidden,
    uiOptions,
    formData: rootFormData,
  });
  const hasVisibleError =
    !isHidden && !shouldIgnoreErrors && rawErrors.length > 0;
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
        {hasVisibleError ? errors : null}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
};
