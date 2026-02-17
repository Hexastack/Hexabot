/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Autocomplete, TextField } from "@mui/material";
import { FieldProps } from "@rjsf/utils";
import { useMemo } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { EntityType } from "@/services/types";

export const ContentAutoCompleteField = (props: FieldProps) => {
  const selectedContentType =
    props.registry.formContext["formData"]["content"]?.["contentType"];
  const { data: contents = [] } = useFind(
    { entity: EntityType.CONTENT },
    {
      params: { where: { "contentType.id": selectedContentType } },
    },
  );
  const options = useMemo(() => {
    if (!selectedContentType || !contents?.[0]) return [];

    const {
      id: _i,
      createdAt: _cr,
      updatedAt: _u,
      contentType: _c,
      dynamicFields,
      ...rest
    } = contents[0];

    return [...Object.keys(rest), ...Object.keys(dynamicFields || {})];
  }, [selectedContentType, contents]);
  const hasOptions = options.length > 0;

  return (
    <Autocomplete
      options={hasOptions ? options : []}
      value={props.formData && hasOptions ? props.formData : ""}
      disabled={!hasOptions}
      onChange={(e, value) => {
        props.onChange(value, ["content", "fields", props.name]);
      }}
      renderInput={(inputProps) => (
        <TextField {...inputProps} label={props.schema.title} />
      )}
    />
  );
};
