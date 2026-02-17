/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WidgetProps } from "@rjsf/utils";

import AutoCompleteEntitySelect from "@/app-components/inputs/AutoCompleteEntitySelect";
import { EntityType, Format } from "@/services/types";
import { IContentType } from "@/types/content-type.types";

export const ContentTypeAutoCompleteWidget = (props: WidgetProps) => {
  return (
    <AutoCompleteEntitySelect<IContentType, "name", boolean>
      searchFields={["name"]}
      entity={EntityType.CONTENT_TYPE}
      format={Format.BASIC}
      labelKey="name"
      idKey="id"
      label={props.label}
      onChange={(_e, selected, ..._) => {
        if (selected) {
          if ("id" in selected) {
            props.onChange(selected.id);
          }
        } else {
          props.onChange("");
        }
      }}
      value={props.value}
    />
  );
};
