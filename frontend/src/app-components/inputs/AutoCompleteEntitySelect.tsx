/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChipTypeMap } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import { forwardRef, useEffect, useState } from "react";

import { useFind } from "@/hooks/crud/useFind";
import { useSearch } from "@/hooks/useSearch";
import { Format } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";
import { TFilterStringFields } from "@/types/search.types";

import AutoCompleteSelect from "./AutoCompleteSelect";

type AutoCompleteEntitySelectProps<
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
> = Omit<
  AutocompleteProps<
    Value,
    Multiple,
    false,
    false,
    ChipTypeMap["defaultComponent"]
  >,
  "renderInput" | "options" | "value" | "defaultValue"
> & {
  value?: Multiple extends true ? string[] : string | null;
  label: string;
  idKey?: string;
  labelKey: Label;
  entity: keyof IEntityMapTypes;
  format: Format;
  searchFields: string[];
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Value[]) => Value[];
  noOptionsWarning?: string;
};

const AutoCompleteEntitySelect = <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  {
    label,
    value,
    entity,
    format,
    searchFields,
    multiple,
    onChange,
    error,
    helperText,
    preprocess,
    idKey = "id",
    ...rest
  }: AutoCompleteEntitySelectProps<Value, Label, Multiple>,
  ref,
) => {
  const { onSearch, searchPayload } = useSearch<Value>({
    $iLike: searchFields as TFilterStringFields<unknown>,
  });
  const [initialValue] = useState(value);
  const { data: defaultData, isLoading: isDefaultLoading } = useFind(
    { entity, format },
    {
      params: {
        where: {
          ...(initialValue && Array.isArray(initialValue)
            ? initialValue.length > 1
              ? { or: initialValue.map((v) => ({ [idKey]: v })) }
              : { [idKey]: initialValue[0] }
            : { [idKey]: initialValue }),
        },
      },
      hasCount: false,
    },
    {
      keepPreviousData: true,
      enabled: Array.isArray(initialValue) ? initialValue.length > 0 : !!value,
    },
  );
  const { data: newData, isLoading } = useFind(
    { entity, format },
    {
      params: {
        ...searchPayload,
        where: { ...searchPayload.where, skip: 0, limit: 10 },
      },
      hasCount: false,
    },
    {
      keepPreviousData: true,
    },
  );
  const data = [...(defaultData || []), ...(newData || [])];
  const [accumulatedOptions, setAccumulatedOptions] = useState<
    Map<string, Value>
  >(new Map());

  useEffect(() => {
    if (data) {
      const newOptions =
        preprocess && data
          ? preprocess((data || []) as Value[])
          : ((data || []) as Value[]);

      setAccumulatedOptions((prevMap) => {
        const newMap = new Map(prevMap);

        newOptions.forEach((option) => {
          const id = option[idKey];

          if (!newMap.has(id)) {
            newMap.set(id, option);
          }
        });

        return newMap;
      });
    }
  }, [JSON.stringify(newData), idKey]);

  const options = Array.from(accumulatedOptions.values());

  return (
    <AutoCompleteSelect<Value, Label, Multiple>
      value={value}
      onChange={onChange}
      label={label}
      multiple={multiple}
      ref={ref}
      idKey={idKey}
      options={options || []}
      onSearch={onSearch}
      error={error}
      helperText={helperText}
      loading={isLoading || isDefaultLoading}
      {...rest}
    />
  );
};

AutoCompleteEntitySelect.displayName = "AutoCompleteEntitySelect";

export default forwardRef(AutoCompleteEntitySelect) as unknown as <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  props: AutoCompleteEntitySelectProps<Value, Label, Multiple> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
  },
) => ReturnType<typeof AutoCompleteEntitySelect>;
