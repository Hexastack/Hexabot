/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema, WidgetProps } from "@rjsf/utils";
import type { ReactNode } from "react";

import {
  JsonataFormulaField,
  type GlobalsSchema,
} from "@/app-components/inputs/JsonataFormulaField";

import { getDescription, LabelWithTooltip } from "./shared";

type JsonataFormContext = {
  globalsSchema?: GlobalsSchema;
};
type JsonataWidgetOptions = {
  emptyValue?: unknown;
  globalsSchema?: GlobalsSchema;
  description?: ReactNode;
};

export const JsonataTextWidget = ({
  id,
  label,
  required,
  disabled,
  readonly,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  schema,
  registry,
  autofocus,
}: WidgetProps) => {
  const widgetOptions = options as JsonataWidgetOptions;
  const context = registry.formContext as JsonataFormContext | undefined;
  const globalsSchema =
    widgetOptions?.globalsSchema ?? context?.globalsSchema;
  const emptyValue = Object.hasOwn(widgetOptions ?? {}, "emptyValue")
    ? widgetOptions?.emptyValue
    : "";
  const normalizeValue = (next: string) => (next === "" ? emptyValue : next);
  const safeValue = typeof value === "string" ? value : String(value ?? "");
  const fieldLabel = label || undefined;
  const description = getDescription(schema as RJSFSchema, widgetOptions);
  const labelWithTooltip = (
    <LabelWithTooltip label={fieldLabel} description={description} />
  );

  return (
    <JsonataFormulaField
      label={labelWithTooltip}
      required={required}
      value={safeValue}
      onChange={(next) => onChange(normalizeValue(next))}
      onBlur={(next) => onBlur?.(id, normalizeValue(next))}
      onFocus={(next) => onFocus?.(id, normalizeValue(next))}
      globalsSchema={globalsSchema}
      disabled={disabled || readonly}
      fullWidth
      autoFocus={Boolean(autofocus)}
    />
  );
};
