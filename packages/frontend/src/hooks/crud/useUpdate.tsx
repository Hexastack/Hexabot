/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useMutation, useQueryClient } from "react-query";

import { QueryType, TMutationOptions, TSetCacheProps } from "@/services/types";
import { IBaseSchema, IEntityMapTypes, THook, TType } from "@/types/base.types";
import { merge } from "@/utils/object";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity, useNormalizeAndCache } from "./helpers";
import { useGetFromCache } from "./useGet";

export const useUpdate = <
  TE extends THook["entity"],
  TAttr = THook<{ entity: TE }>["attributes"],
  TBasic extends IBaseSchema = THook<{ entity: TE }>["basic"],
  TFull extends IBaseSchema = THook<{ entity: TE }>["full"],
>(
  entity: TE,
  options?: TMutationOptions<
    TBasic,
    Error,
    { id: string; params: Partial<TAttr> },
    TBasic
  >,
) => {
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const normalizeAndCache = useNormalizeAndCache<TBasic, string>(entity);
  const queryClient = useQueryClient();
  const { invalidate = true, ...otherOptions } = options || {};

  return useMutation({
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

      return entities[entity]?.[result] as unknown as TBasic;
    },
    ...otherOptions,
  });
};

export const useUpdateCache = <E extends keyof IEntityMapTypes>(entity: E) => {
  const getFromCache = useGetFromCache(entity);
  const queryClient = useQueryClient();

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
