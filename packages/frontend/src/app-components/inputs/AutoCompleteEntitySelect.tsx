/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

const PAGE_SIZE = 20;

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
      initialPageParam: {
        limit: PAGE_SIZE,
        skip: 0,
      },
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < PAGE_SIZE) {
          return undefined;
        }

        return {
          limit: PAGE_SIZE,
          skip: allPages.length * PAGE_SIZE,
        };
      },
      placeholderData: (prev) => prev,
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
    fetchNextPage();
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
