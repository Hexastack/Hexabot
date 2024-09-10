/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { useQuery, useQueryClient, UseQueryOptions } from "react-query";

import { EntityType, Format, QueryType } from "@/services/types";
import {
  IBaseSchema,
  IDynamicProps,
  IEntityMapTypes,
  POPULATE_BY_TYPE,
  TAllowedFormat,
  TType,
} from "@/types/base.types";

import { useNormalizeAndCache } from "./helpers";
import { useEntityApiClient } from "../useApiClient";

export const useGet = <
  TDynamicProps extends IDynamicProps,
  TAttr = TType<TDynamicProps["entity"]>["attributes"],
  TBasic extends IBaseSchema = TType<TDynamicProps["entity"]>["basic"],
  TFull extends IBaseSchema = TType<TDynamicProps["entity"]>["full"],
>(
  id: string,
  { entity, format }: TDynamicProps & TAllowedFormat<TDynamicProps["entity"]>,
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
