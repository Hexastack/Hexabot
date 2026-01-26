/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Widgets } from "@rjsf/mui";
import type { RJSFSchema, WidgetProps } from "@rjsf/utils";

import {
  getDescription,
  labelTooltipInputLabelSx,
  LabelWithTooltip,
  mergeLabelSx,
} from "./shared";

export const ActionSelectWidget = (props: WidgetProps) => {
  const description = getDescription(props.schema as RJSFSchema, props.options);
  const label = (
    <LabelWithTooltip label={props.label} description={description} />
  );
  const inputLabelProps = {
    ...props.InputLabelProps,
    sx: mergeLabelSx(labelTooltipInputLabelSx, props.InputLabelProps?.sx),
  };

  return (
    <Widgets.SelectWidget
      {...props}
      InputLabelProps={inputLabelProps}
      label={label as unknown as string}
    />
  );
};
