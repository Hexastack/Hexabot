/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useInfiniteQuery, UseInfiniteQueryOptions } from "react-query";

import { EntityType, Format, QueryType } from "@/services/types";
import { IFindConfigProps, POPULATE_BY_TYPE, THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useGetFromCache } from "./useGet";

export const useInfiniteFind = <
  T extends THook["params"],
  TAttr extends THook<T>["attributes"],
  TBasic extends THook<T>["basic"],
  TFilters extends THook<T>["filters"],
  TFull extends THook<T>["full"],
  P = THook<T>["populate"],
>(
  { entity, format }: THook<T>["params"],
  config?: IFindConfigProps<TFilters>,
  options?: Omit<
    UseInfiniteQueryOptions<
      string[],
      Error,
      string[],
      TBasic[],
      [QueryType, EntityType, string]
    >,
    "queryFn" | "onSuccess"
  > & { onSuccess?: (result: TBasic[]) => void },
) => {
  const { onSuccess, queryKey, ...otherOptions } = options || {};
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const normalizeAndCache = useNormalizeAndCache<TBasic | TFull, string[]>(
    entity,
  );
  const getFromCache = useGetFromCache(entity);
  // @TODO : fix the following
  // @ts-ignore
  const { data: infiniteData, ...infiniteQuery } = useInfiniteQuery({
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
    keepPreviousData: true,
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
