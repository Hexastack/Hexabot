/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WidgetProps } from "@rjsf/utils";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { Format, normalizeEntity } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";

import { Rjsf } from "../fields/AutoCompleteField";

const AutoCompleteWidgetWrapper = ({
  value,
  title = "",
  entity,
  valueKey = "",
  labelKey = "",
  onChange,
}: Rjsf["uiSchema"]["ui:options"] & {
  title?: string;
  value: any;
  entity: keyof IEntityMapTypes;
  onChange: (value: any) => void;
}) => {
  return (
    <AutoCompleteEntitySelect<any, string, boolean>
      searchFields={[]}
      entity={entity}
      format={Format.BASIC}
      labelKey={labelKey}
      label={title}
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
    />
  );
};

export const AutoCompleteWidget = ({
  value,
  uiSchema,
  onChange,
}: WidgetProps) => {
  const {
    entity,
    labelKey = "",
    ...props
  } = uiSchema?.["ui:options"] as Rjsf["uiSchema"]["ui:options"];

  if (entity) {
    return (
      <AutoCompleteWidgetWrapper
        entity={normalizeEntity(entity)}
        value={value}
        labelKey={labelKey}
        onChange={onChange}
        {...props}
      />
    );
  }
};
