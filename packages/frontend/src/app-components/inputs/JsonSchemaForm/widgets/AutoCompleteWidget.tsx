/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { RJSFSchema, WidgetProps } from "@rjsf/utils";
import type { ReactNode } from "react";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Format, normalizeEntity } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";

import { Rjsf } from "../fields/AutoCompleteField";

import {
  getDescription,
  labelTooltipInputLabelSx,
  LabelWithTooltip,
  mergeLabelSx,
} from "./shared";

type AutoCompleteWidgetOptions = Omit<Rjsf["uiSchema"]["ui:options"], "label">;

const AutoCompleteWidgetWrapper = ({
  value,
  label,
  inputLabelSx,
  entity,
  valueKey = "",
  labelKey = "",
  onChange,
  enableEntityAddButton,
}: AutoCompleteWidgetOptions & {
  label?: ReactNode;
  inputLabelSx?: unknown;
  value: any;
  entity: keyof IEntityMapTypes;
  onChange: (value: any) => void;
  enableEntityAddButton?: boolean;
}) => {
  return (
    <AutoCompleteEntitySelect<any, string, boolean>
      searchFields={[]}
      entity={entity}
      format={Format.BASIC}
      labelKey={labelKey}
      label={label ?? ""}
      inputLabelSx={inputLabelSx}
      value={value}
      onChange={(_e, selected, ..._) => {
        if (selected) {
          if (valueKey in selected) {
            onChange(selected[valueKey]);
          }
        } else {
          onChange("");
        }
      }}
      enableEntityAddButton={enableEntityAddButton}
    />
  );
};

export const AutoCompleteWidget = ({
  value,
  label: fieldLabel,
  schema,
  options,
  InputLabelProps,
  uiSchema,
  onChange,
}: WidgetProps) => {
  const description = getDescription(schema as RJSFSchema, options);
  const label = (
    <LabelWithTooltip
      label={fieldLabel || undefined}
      description={description}
    />
  );
  const inputLabelSx = mergeLabelSx(
    labelTooltipInputLabelSx,
    InputLabelProps?.sx,
  );
  const {
    entity,
    labelKey = "",
    ...props
  } = uiSchema?.["ui:options"] as AutoCompleteWidgetOptions;

  if (entity) {
    return (
      <AutoCompleteWidgetWrapper
        entity={normalizeEntity(entity)}
        value={value}
        label={label}
        inputLabelSx={inputLabelSx}
        labelKey={labelKey}
        onChange={onChange}
        {...props}
      />
    );
  }

  return null;
};
