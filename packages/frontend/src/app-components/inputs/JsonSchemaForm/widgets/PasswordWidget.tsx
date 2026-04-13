/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getTemplate, type WidgetProps } from "@rjsf/utils";

import { createReadOnlyInputProps } from "../../readOnlyInput.util";

export const PasswordWidget = (props: WidgetProps) => {
  const { autoComplete, onChange, options, registry, slotProps, value } = props;
  const BaseInputTemplate = getTemplate<"BaseInputTemplate">(
    "BaseInputTemplate",
    registry,
    options,
  );

  return (
    <BaseInputTemplate
      {...props}
      type="password"
      value={
        typeof value === "string" ? value : value == null ? "" : String(value)
      }
      onChange={(nextValue) => onChange(nextValue ?? "")}
      slotProps={{
        ...slotProps,
        htmlInput: autoComplete
          ? slotProps?.htmlInput
          : createReadOnlyInputProps(slotProps?.htmlInput),
      }}
    />
  );
};
