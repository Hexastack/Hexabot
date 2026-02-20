/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Templates } from "@rjsf/mui";
import type { BaseInputTemplateProps, RJSFSchema } from "@rjsf/utils";

import {
  getDescription,
  labelTooltipInputLabelSx,
  LabelWithTooltip,
  mergeLabelSx,
} from "../widgets/shared";

export const ActionBaseInputTemplate = (props: BaseInputTemplateProps) => {
  const description = getDescription(props.schema as RJSFSchema, props.options);
  const label = (
    <LabelWithTooltip label={props.label} description={description} />
  );
  const inputLabelProps = {
    ...props.InputLabelProps,
    sx: mergeLabelSx(labelTooltipInputLabelSx, props.InputLabelProps?.sx),
  };
  const BaseInputTemplate = Templates.BaseInputTemplate;

  if (!BaseInputTemplate) {
    return null;
  }

  return (
    <BaseInputTemplate
      {...props}
      InputLabelProps={inputLabelProps}
      label={label as unknown as string}
    />
  );
};
