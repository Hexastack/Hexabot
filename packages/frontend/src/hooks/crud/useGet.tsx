/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format, QueryType } from "@/services/types";
import { POPULATE_BY_TYPE, THook } from "@/types/base.types";
import { UseQueryOptions } from "@/types/tanstack.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useTanstackQuery, useTanstackQueryClient } from "./useTanstack";

export const useGet = <
  T extends THook["params"],
  TBasic extends THook["basic"] = THook<T>["basic"],
>(
  id: string,
  { entity, format }: THook<T>["params"],
  options?: Omit<
    UseQueryOptions<
      unknown,
      Error,
      TBasic,
      [QueryType.item, EntityType, string]
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string>(entity);

  return useTanstackQuery({
    queryFn: async () => {
      const data = await api.get(
        id,
        format === Format.FULL ? POPULATE_BY_TYPE[entity] : undefined,
      );
      const { entities, result } = normalizeAndCache(data);

      return entities[entity]?.[result];
    },
    queryKey: [QueryType.item, entity, id],
    enabled: options?.enabled && !!id,
    ...options,
  });
};

export const useGetFromCache = <TE extends THook["entity"]>(entity: TE) => {
  const queryClient = useTanstackQueryClient();

  return (id: string) => {
    const [qEntity] = entity.split("/");

    return queryClient.getQueryData([QueryType.item, qEntity, id]) as
      | THook<{ entity: TE }>["basic"]
      | undefined;
  };
};
