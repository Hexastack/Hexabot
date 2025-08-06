/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { normalize } from "normalizr";
import { useQueryClient } from "react-query";

import { ENTITY_MAP } from "@/services/entities";
import { EntityType, QueryType } from "@/services/types";
import { IBaseSchema, IEntityMapTypes, THook, TType } from "@/types/base.types";

import { useGetFromCache } from "./useGet";

export const useNormalizeAndCache = <
  TData extends IBaseSchema,
  TResult,
  TAny extends IBaseSchema = IBaseSchema,
>(
  entity: keyof IEntityMapTypes,
) => {
  const queryClient = useQueryClient();

  return (data: TData | TData[]) => {
    if (!(entity in ENTITY_MAP)) {
      throw new Error(`Entity ${entity} is missing in ENTITY_MAP`);
    }

    if (!data) {
      throw new Error(`No data to normalize !`);
    }

    const schemaEntity = ENTITY_MAP[entity];
    const { entities, result } = normalize<
      TAny,
      Record<EntityType, Record<string, TAny>>,
      TResult
    >(data, Array.isArray(data) ? [schemaEntity] : schemaEntity);

    Object.entries(entities).forEach(([entityType, dataDict]) => {
      if (dataDict) {
        Object.entries(dataDict).forEach(([id, newData]) => {
          if (id && newData) {
            queryClient.setQueryData(
              [QueryType.item, entityType, id],
              (previousData: any) => {
                return {
                  ...previousData,
                  ...newData,
                };
              },
            );
          }
        });
      }
    });

    return { entities, result };
  };
};

export const isSameEntity = (qEntity: unknown, entity: string) => {
  // We may have entities referencing the same entity type : Menu and Menu/tree
  return typeof qEntity === "string" && qEntity.split("/")[0] === entity;
};

export const useSortCachedEntities = <
  TE extends THook["entity"],
  TBasic extends IBaseSchema = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  criteria: keyof TBasic & keyof TType<TE>["basic"] = "updatedAt",
  order: "ASC" | "DESC" = "ASC",
) => {
  const getMessageFromCache = useGetFromCache(entity);

  return (a: string, b: string) => {
    const [cached1, cached2] = [a, b].map(getMessageFromCache);
    const xor = order === "ASC" ? 1 : -1;

    if (cached1?.[criteria] && cached2?.[criteria]) {
      return cached1[criteria] > cached2[criteria] ? -1 * xor : 1 * xor;
    }

    return 1;
  };
};
