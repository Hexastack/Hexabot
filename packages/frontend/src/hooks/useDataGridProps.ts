/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IFindConfigProps, THook } from "@/types/base.types";
import {
  SearchHookOptions,
  SearchPayload,
  TParamItem,
} from "@/types/search.types";

import { useFind } from "./crud/useFind";
import { useSearch } from "./useSearch";

export const useDataGridProps = <
  TP extends THook["params"],
  TE extends THook<TP>["entity"],
  TFilters extends THook<{ entity: TE }>["filters"],
>(
  { entity, format }: THook<{ entity: TE }>["params"],
  {
    searchParams: { syncUrl, ...extendedSearchParams },
    ...rest
  }: IFindConfigProps<TFilters> & {
    searchParams: TParamItem<TFilters> &
      SearchHookOptions & {
        getFindParams?: (
          searchPayload: SearchPayload<TFilters>,
        ) => SearchPayload<TFilters>;
      };
  },
) => {
  const { getFindParams = (searchPayload) => searchPayload, ...searchParams } =
    extendedSearchParams;
  const { onSearch, searchPayload, searchText } = useSearch(searchParams, {
    syncUrl,
  });
  const { dataGridProps } = useFind(
    { entity: entity as TE, format },
    { params: getFindParams(searchPayload), ...rest },
  );

  return {
    onSearch,
    searchText,
    searchPayload,
    dataGridProps,
  };
};
