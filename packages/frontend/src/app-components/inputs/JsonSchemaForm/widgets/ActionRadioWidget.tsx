/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Widgets } from "@rjsf/mui";
import type { RJSFSchema, WidgetProps } from "@rjsf/utils";

import { getDescription, LabelWithTooltip } from "./shared";

export const ActionRadioWidget = (props: WidgetProps) => {
  const description = getDescription(props.schema as RJSFSchema, props.options);
  const label = (
    <LabelWithTooltip label={props.label} description={description} />
  );

  return <Widgets.RadioWidget {...props} label={label as unknown as string} />;
};
