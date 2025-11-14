/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions, TSetCacheProps } from "@/services/types";
import { IEntityMapTypes, THook, TType } from "@/types/base.types";
import { merge } from "@/utils/object";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity, useNormalizeAndCache } from "./helpers";
import { useGetFromCache } from "./useGet";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useUpdate = <
  TE extends THook["entity"],
  TAttr extends THook["attributes"] = THook<{ entity: TE }>["attributes"],
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<
    TBasic,
    Error,
    { id: string; params: Partial<TAttr> },
    TBasic
  >,
) => {
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string>(entity);
  const queryClient = useTanstackQueryClient();
  const { invalidate = true, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async ({ id, params }) => {
      const data = await api.update(id, params);
      const { entities, result } = normalizeAndCache(data);
      // Invalidate all counts & collections

      if (invalidate) {
        queryClient.removeQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              (qType === QueryType.count || qType === QueryType.collection) &&
              isSameEntity(qEntity, entity)
            );
          },
        });
      }

      return entities[entity]?.[result] as TBasic;
    },
    ...otherOptions,
  });
};

export const useUpdateCache = <E extends keyof IEntityMapTypes>(entity: E) => {
  const getFromCache = useGetFromCache(entity);
  const queryClient = useTanstackQueryClient();

  return ({
    id,
    payload = {},
    preprocess = (data) => data,
    strategy = "merge",
  }: TSetCacheProps<TType<E>["basic"]>) => {
    const oldData = getFromCache(id);
    const newData =
      strategy === "merge" && oldData
        ? merge(preprocess(oldData), payload)
        : payload;
    const [qEntity] = entity.split("/");

    queryClient.setQueryData([QueryType.item, qEntity, id], newData);
  };
};
