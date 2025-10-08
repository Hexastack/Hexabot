/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { normalize } from "normalizr";
import { useQueryClient } from "react-query";

import { ENTITY_MAP } from "@/services/entities";
import { EntityType, QueryType } from "@/services/types";
import { IBaseSchema, IEntityMapTypes } from "@/types/base.types";

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
