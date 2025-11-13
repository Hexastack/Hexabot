/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format, QueryType } from "@/services/types";
import {
  IBaseSchema,
  IEntityMapTypes,
  POPULATE_BY_TYPE,
  THook,
  TType,
} from "@/types/base.types";
import { UseQueryOptions } from "@/types/tanstack.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useTanstackQuery, useTanstackQueryClient } from "./useTanstack";

export const useGet = <
  T extends THook["params"],
  TAttr = THook<T>["attributes"],
  TBasic extends IBaseSchema = THook<T>["basic"],
  TFull extends IBaseSchema = THook<T>["full"],
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
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const normalizeAndCache = useNormalizeAndCache<TBasic | TFull, string>(
    entity,
  );

  return useTanstackQuery({
    queryFn: async () => {
      const data = await api.get(
        id,
        format === Format.FULL ? POPULATE_BY_TYPE[entity] : undefined,
      );
      const { entities, result } = normalizeAndCache(data);

      return entities[entity]?.[result] as unknown as TBasic;
    },
    queryKey: [QueryType.item, entity, id],
    enabled: options?.enabled && !!id,
    ...options,
  });
};

export const useGetFromCache = <
  E extends keyof IEntityMapTypes,
  TData extends IBaseSchema = TType<E>["basic"],
>(
  entity: E,
) => {
  const queryClient = useTanstackQueryClient();

  return (id: string) => {
    const [qEntity] = entity.split("/");

    return queryClient.getQueryData([QueryType.item, qEntity, id]) as
      | TData
      | undefined;
  };
};
