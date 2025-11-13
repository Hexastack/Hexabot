/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect } from "react";

import { EntityType, Format, QueryType } from "@/services/types";
import { IFindConfigProps, POPULATE_BY_TYPE, THook } from "@/types/base.types";
import { UseQueryOptions } from "@/types/tanstack.types";

import { useEntityApiClient } from "../useApiClient";
import { usePagination } from "../usePagination";

import { useNormalizeAndCache } from "./helpers";
import { useCount } from "./useCount";
import { useGetFromCache } from "./useGet";
import { useTanstackQuery } from "./useTanstack";

export const useFind = <
  TP extends THook["params"],
  TE extends THook<TP>["entity"] = THook<TP>["entity"],
  TBasic extends THook<TP>["basic"] = THook<TP>["basic"],
  P = THook<TP>["populate"],
>(
  { entity, format }: THook<TP>["params"],
  config?: IFindConfigProps<TE>,
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
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string[]>(entity);
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
  const { data: ids, ...normalizedQuery } = useTanstackQuery({
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
    ...otherOptions,
  });

  useEffect(() => {
    if (ids) {
      onSuccess?.((ids || []).map((id) => getFromCache(id) as TBasic));
    }
  }, [ids]);
  const data = (ids || [])
    .map((id) => getFromCache(id) as TBasic)
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
