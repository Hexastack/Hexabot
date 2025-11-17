/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format, QueryType } from "@/services/types";
import { IFindConfigProps, POPULATE_BY_TYPE, THook } from "@/types/base.types";
import { UseInfiniteQueryOptions } from "@/types/tanstack.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useGetFromCache } from "./useGet";
import { useTanstackInfiniteQuery } from "./useTanstack";

const PAGE_SIZE = 20;

export const useInfiniteFind = <
  T extends THook["params"],
  TBasic extends THook<T>["basic"],
  P = THook<T>["populate"],
>(
  { entity, format }: THook<T>["params"],
  config?: IFindConfigProps<THook<T>["entity"]>,
  options?: Omit<
    UseInfiniteQueryOptions<
      string[],
      Error,
      string[],
      [QueryType, EntityType, string],
      { limit: number; skip: number }
    >,
    "queryFn" | "onSuccess"
  > & { onSuccess?: (result: TBasic[]) => void },
) => {
  const { onSuccess, queryKey = [], ...otherOptions } = options || {};
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string[]>(entity);
  const getFromCache = useGetFromCache(entity);
  const { data: infiniteData, ...infiniteQuery } = useTanstackInfiniteQuery({
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
    queryKey,
    queryFn: async () => {
      const data = await api.find(
        {
          ...(config?.params || {}),
        },
        format === Format.FULL && (POPULATE_BY_TYPE[entity] as P),
      );
      const { entities, result } = normalizeAndCache(data);

      if (onSuccess) {
        onSuccess(
          Object.values(entities[entity] as unknown as Record<string, TBasic>),
        );
      }

      return result;
    },
    placeholderData: (prev) => prev,
    ...(otherOptions || {}),
  });

  return {
    ...infiniteQuery,
    data: infiniteData
      ? {
          ...infiniteData,
          pages: (infiniteData?.pages || []).map((page) =>
            page.map((id) => getFromCache(id) as unknown as TBasic),
          ),
        }
      : undefined,
  };
};
