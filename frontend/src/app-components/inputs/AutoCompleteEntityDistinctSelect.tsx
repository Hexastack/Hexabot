/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Box, ChipTypeMap, ListSubheader } from "@mui/material";
import { AutocompleteProps } from "@mui/material/Autocomplete";
import { forwardRef, useEffect, useRef } from "react";

import { useGetFromCache } from "@/hooks/crud/useGet";
import { useInfiniteFind } from "@/hooks/crud/useInfiniteFind";
import { useSearch } from "@/hooks/useSearch";
import { Format, QueryType } from "@/services/types";
import { IEntityMapTypes, THook } from "@/types/base.types";
import { TFilterStringFields } from "@/types/search.types";
import { generateId } from "@/utils/generateId";

import AutoCompleteSelect from "./AutoCompleteSelect";

type AutoCompleteEntityDistinctSelectProps<
  TE extends THook["entity"],
  Value extends THook<{ entity: TE }>["full"] = THook<{ entity: TE }>["full"],
  Label extends keyof Value = keyof Value,
> = Omit<
  AutocompleteProps<Value, true, false, false, ChipTypeMap["defaultComponent"]>,
  "renderInput" | "options" | "value" | "defaultValue" | "multiple"
> & {
  value?: string[];
  label: string;
  idKey?: string;
  sortKey?: string;
  groupKey: string;
  defaultGroupTitle: string;
  labelKey: Label;
  entity: keyof IEntityMapTypes;
  subEntity: keyof IEntityMapTypes;
  searchFields: string[];
  disableSearch?: boolean;
  error?: boolean;
  helperText?: string | null | undefined;
  preprocess?: (data: Value[]) => Value[];
  noOptionsWarning?: string;
};

const AutoCompleteEntityDistinctSelect = <
  TE extends THook["entity"],
  Value extends THook<{ entity: TE }>["full"] = THook<{ entity: TE }>["full"],
  Label extends keyof Value = keyof Value,
>(
  {
    entity,
    subEntity,
    groupKey,
    defaultGroupTitle,
    searchFields,
    disableSearch,
    preprocess,
    idKey = "id",
    sortKey = "id",
    labelKey,
    ...rest
  }: AutoCompleteEntityDistinctSelectProps<TE, Value, Label>,
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
  const getEntityFromCache = useGetFromCache(entity);
  const getSubEntityFromCache = useGetFromCache(subEntity);
  const params = {
    where: {
      or: searchPayload.where?.or || [],
    },
  };
  const { data, isFetching, fetchNextPage } = useInfiniteFind(
    { entity, format: Format.FULL },
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
    .sort((a, b) => (a[sortKey] ?? "").localeCompare(b[sortKey] ?? ""));
  const options =
    preprocess && flattenedData
      ? preprocess((flattenedData || []) as Value[])
      : ((flattenedData || []) as Value[]);

  useEffect(() => {
    fetchNextPage({ pageParam: params });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(searchPayload)]);

  return (
    <AutoCompleteSelect<Value, Label, true>
      ref={ref}
      idKey={idKey}
      labelKey={labelKey}
      options={options || []}
      onSearch={onSearch}
      loading={isFetching}
      getOptionDisabled={(option) => {
        const selectedOptions = rest.value;
        const selectedGroup = option[sortKey];
        const isOptionSelected = selectedOptions?.includes(option[idKey]);

        if (Array.isArray(selectedOptions)) {
          const selectedGroups = [
            ...new Set(
              selectedOptions?.map(
                (option) => getEntityFromCache(option)?.[sortKey] || "",
              ),
            ),
          ];
          const isOptionGroupSelected = selectedGroups.includes(selectedGroup);

          return !isOptionSelected && isOptionGroupSelected;
        }

        return false;
      }}
      groupBy={(option) => {
        if (option[sortKey]) {
          const sortEntityId = option[sortKey];
          const groupTitle = getSubEntityFromCache(sortEntityId)?.[groupKey];

          return groupTitle || defaultGroupTitle;
        }

        return defaultGroupTitle;
      }}
      renderGroup={({ key, group, children }) => (
        <Box key={key}>
          <ListSubheader
            sx={{
              top: "-8px",
              border: "0.5px solid #eee",
              bgcolor: "#fafafaee",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
            color="primary"
          >
            {group}
          </ListSubheader>
          {children}
        </Box>
      )}
      multiple
      {...rest}
    />
  );
};

AutoCompleteEntityDistinctSelect.displayName =
  "AutoCompleteEntityDistinctSelect";

export default forwardRef(AutoCompleteEntityDistinctSelect) as <
  TE extends THook["entity"],
>(
  props: AutoCompleteEntityDistinctSelectProps<TE> & {
    ref?: React.ForwardedRef<HTMLDivElement>;
    entity: TE;
  },
) => ReturnType<typeof AutoCompleteEntityDistinctSelect>;
