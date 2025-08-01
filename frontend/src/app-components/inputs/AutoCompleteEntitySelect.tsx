/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ChipTypeMap } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import { forwardRef, useEffect, useRef } from "react";

import { useInfiniteFind } from "@/hooks/crud/useInfiniteFind";
import { useSearch } from "@/hooks/useSearch";
import { Format, QueryType } from "@/services/types";
import { IEntityMapTypes } from "@/types/base.types";
import { TFilterStringFields } from "@/types/search.types";
import { generateId } from "@/utils/generateId";

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
  sortKey?: string;
  labelKey: Label;
  entity: keyof IEntityMapTypes;
  format: Format;
  searchFields: string[];
  disableSearch?: boolean;
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Value[]) => Value[];
  noOptionsWarning?: string;
  isDisabledWhenEmpty?: boolean;
};

const AutoCompleteEntitySelect = <
  Value,
  Label extends keyof Value = keyof Value,
  Multiple extends boolean | undefined = true,
>(
  {
    entity,
    format,
    searchFields,
    disableSearch,
    preprocess,
    idKey = "id",
    sortKey = "id",
    labelKey,
    ...rest
  }: AutoCompleteEntitySelectProps<Value, Label, Multiple>,
  ref,
) => {
  const { onSearch, searchPayload } = useSearch<typeof entity>(
    disableSearch
      ? {}
      : {
          $or: (searchFields as TFilterStringFields<unknown>) || [
            idKey,
            labelKey,
          ],
        },
  );
  const idRef = useRef(generateId());
  const params = {
    where: {
      or: searchPayload.where?.or || [],
    },
  };
  const { data, isFetching, fetchNextPage } = useInfiniteFind(
    { entity, format },
    {
      params,
      hasCount: false,
    },
    {
      keepPreviousData: true,
      queryKey: [QueryType.collection, entity, `autocomplete/${idRef.current}`],
    },
  );
  // flatten & filter unique & sort
  const flattenedData = data?.pages
    ?.flat()
    .filter(
      (a, idx, self) =>
        self.findIndex((b) => a?.[idKey] === b?.[idKey]) === idx,
    )
    .sort((a, b) => -b[sortKey]?.localeCompare(a[sortKey]));
  const options =
    preprocess && flattenedData
      ? preprocess((flattenedData || []) as unknown as Value[])
      : ((flattenedData || []) as Value[]);

  useEffect(() => {
    fetchNextPage({ pageParam: params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(searchPayload)]);

  return (
    <AutoCompleteSelect<Value, Label, Multiple>
      ref={ref}
      idKey={idKey}
      labelKey={labelKey}
      options={options || []}
      onSearch={onSearch}
      loading={isFetching}
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
