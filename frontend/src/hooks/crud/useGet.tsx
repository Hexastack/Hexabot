/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useQuery, useQueryClient, UseQueryOptions } from "react-query";

import { EntityType, Format, QueryType } from "@/services/types";
import {
  IBaseSchema,
  IEntityMapTypes,
  POPULATE_BY_TYPE,
  THook,
  TType,
} from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";

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

  return useQuery({
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
  const queryClient = useQueryClient();

  return (id: string) => {
    const [qEntity] = entity.split("/");

    return queryClient.getQueryData([QueryType.item, qEntity, id]) as
      | TData
      | undefined;
  };
};
