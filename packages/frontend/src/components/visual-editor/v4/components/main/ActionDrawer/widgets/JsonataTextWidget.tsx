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
  label,
  required,
  disabled,
  readonly,
  value,
  onChange,
  options,
  schema,
  registry,
}: WidgetProps) => {
  const widgetOptions = options as JsonataWidgetOptions;
  const context = registry.formContext as JsonataFormContext | undefined;
  const globalsSchema =
    widgetOptions?.globalsSchema ?? context?.globalsSchema;
  const emptyValue = widgetOptions?.emptyValue;
  const safeValue =
    typeof value === "string" ? value : value == null ? "" : String(value);
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
      onChange={(next) => onChange(next === "" ? emptyValue : next)}
      globalsSchema={globalsSchema}
      disabled={disabled || readonly}
      fullWidth
    />
  );
};
