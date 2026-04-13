/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FormControlLabel, Switch } from "@mui/material";
import {
  ariaDescribedByIds,
  labelValue,
  schemaRequiresTrueValue,
  type RJSFSchema,
  type WidgetProps,
} from "@rjsf/utils";

import { getDescription, LabelWithTooltip } from "./shared";

export const ActionCheckboxWidget = ({
  schema,
  id,
  htmlName,
  value,
  disabled,
  readonly,
  label: fieldLabel = "",
  hideLabel,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  options,
}: WidgetProps) => {
  const description = getDescription(schema as RJSFSchema, options);
  const required = schemaRequiresTrueValue(schema);
  const checked = typeof value === "undefined" ? false : Boolean(value);
  const labelWithTooltip = (
    <LabelWithTooltip label={fieldLabel} description={description} />
  );

  return (
    <FormControlLabel
      control={
        <Switch
          id={id}
          name={htmlName || id}
          checked={checked}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={(_, nextChecked) => onChange(nextChecked)}
          onBlur={() => onBlur(id, value)}
          onFocus={() => onFocus(id, value)}
          aria-describedby={ariaDescribedByIds(id)}
        />
      }
      label={labelValue(
        labelWithTooltip as unknown as string,
        hideLabel,
        false,
      )}
    />
  );
};
