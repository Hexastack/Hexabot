/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FormControl } from "@mui/material";
import { getTemplate, getUiOptions, type FieldTemplateProps } from "@rjsf/utils";

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
  const shouldShowOnlyWhenWebUrlButton =
    uiOptions?.showOnlyWhenWebUrlButton === true;
  const rootFormData = props.registry.formContext?.formData as
    | Record<string, unknown>
    | undefined;
  const contentNode =
    (rootFormData?.content as Record<string, unknown> | undefined) ??
    rootFormData;
  const buttons = contentNode?.buttons;
  const hasWebUrlButton =
    Array.isArray(buttons) &&
    buttons.some(
      (button) =>
        button &&
        typeof button === "object" &&
        (button as { type?: string }).type === "web_url",
    );
  const WrapIfAdditionalTemplate = getTemplate(
    "WrapIfAdditionalTemplate",
    registry,
    uiOptions,
  );

  if (hidden || (shouldShowOnlyWhenWebUrlButton && !hasWebUrlButton)) {
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
      <FormControl fullWidth error={rawErrors.length > 0} required={required}>
        {children}
        {errors}
        {help}
      </FormControl>
    </WrapIfAdditionalTemplate>
  );
};
