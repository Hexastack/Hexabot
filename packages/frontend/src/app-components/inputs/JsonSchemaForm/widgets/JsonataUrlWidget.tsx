/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getTemplate, type WidgetProps } from "@rjsf/utils";

import { JsonataTextWidget } from "./JsonataTextWidget";

export const JsonataUrlWidget = (props: WidgetProps) => {
  const normalizedValue =
    typeof props.value === "string" ? props.value : String(props.value ?? "");

  if (normalizedValue.startsWith("=")) {
    return <JsonataTextWidget {...props} value={normalizedValue} autofocus />;
  }

  const BaseInputTemplate = getTemplate(
    "BaseInputTemplate",
    props.registry,
    props.options,
  );

  return (
    <BaseInputTemplate
      type="url"
      {...props}
      value={normalizedValue}
      autoFocus
    />
  );
};
