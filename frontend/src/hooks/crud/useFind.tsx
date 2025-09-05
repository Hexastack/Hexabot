/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useQuery, UseQueryOptions } from "react-query";

import { EntityType, Format, QueryType } from "@/services/types";
import { IFindConfigProps, POPULATE_BY_TYPE, THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";
import { usePagination } from "../usePagination";

import { useNormalizeAndCache } from "./helpers";
import { useCount } from "./useCount";
import { useGetFromCache } from "./useGet";

export const useFind = <
  TP extends THook["params"],
  TBasic extends THook<TP>["basic"],
  TAttr extends THook<TP>["attributes"],
  TFilters extends THook<TP>["filters"],
  TFull extends THook<TP>["full"],
  P = THook<TP>["populate"],
>(
  { entity, format }: THook<TP>["params"],
  config?: IFindConfigProps<TFilters>,
  options?: Omit<
    UseQueryOptions<string[], Error, string[], [QueryType, EntityType, string]>,
    "queryFn" | "queryKey" | "onSuccess"
  > & { onSuccess?: (result: TBasic[]) => void },
) => {
  const {
    params = {},
    hasCount = true,
    initialSortState,
    initialPaginationState,
  } = config || {};
  const { onSuccess, ...otherOptions } = options || {};
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const normalizeAndCache = useNormalizeAndCache<TBasic | TFull, string[]>(
    entity,
  );
  const getFromCache = useGetFromCache(entity);
  const countQuery = useCount(entity, params["where"], {
    enabled: hasCount,
  });
  const { dataGridPaginationProps, pageQueryPayload } = usePagination(
    countQuery.data?.count,
    initialPaginationState,
    initialSortState,
    hasCount,
  );
  const normalizedParams = { ...pageQueryPayload, ...(params || {}) };
  const enabled = !!countQuery.data || !hasCount;
  const { data: ids, ...normalizedQuery } = useQuery({
    enabled,
    queryFn: async () => {
      const data =
        !hasCount || (hasCount && !!countQuery.data?.count)
          ? await api.find(
              normalizedParams,
              format === Format.FULL && (POPULATE_BY_TYPE[entity] as P),
            )
          : [];
      const { result } = normalizeAndCache(data);

      return result;
    },
    queryKey: [QueryType.collection, entity, JSON.stringify(normalizedParams)],
    onSuccess: (ids) => {
      if (onSuccess) {
        onSuccess(
          (ids || []).map((id) => getFromCache(id) as unknown as TBasic),
        );
      }
    },
    keepPreviousData: true,
    ...otherOptions,
  });
  const data = (ids || [])
    .map((id) => getFromCache(id) as unknown as TBasic)
    // @TODO : In case we deleted the items, but still present in collection
    .filter((d) => !!d);

  return {
    ...normalizedQuery,
    data,
    dataGridProps: {
      ...dataGridPaginationProps,
      rows: data || [],
      loading:
        normalizedQuery.isLoading ||
        normalizedQuery.isFetching ||
        countQuery.isLoading ||
        countQuery.isFetching,
      error: Boolean(normalizedQuery.error || countQuery.error),
    },
  };
};
