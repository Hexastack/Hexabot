/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions } from "@/services/types";
import { IBaseSchema, THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity } from "./helpers";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useDeleteMany = <
  TE extends THook["entity"],
  TAttr = THook<{ entity: TE }>["attributes"],
  TBasic extends IBaseSchema = THook<{ entity: TE }>["basic"],
  TFull extends IBaseSchema = THook<{ entity: TE }>["full"],
>(
  entity: TE,
  options?: TMutationOptions<string, Error, string[], TBasic>,
) => {
  const api = useEntityApiClient<TAttr, TBasic, TFull>(entity);
  const queryClient = useTanstackQueryClient();
  const { invalidate = true, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async (ids: string[]) => {
      const result = await api.deleteMany(ids);

      queryClient.removeQueries({
        predicate: ({ queryKey }) => {
          const [qType, qEntity, qId] = queryKey;

          return (
            qType === QueryType.item &&
            isSameEntity(qEntity, entity) &&
            ids.includes(qId as string)
          );
        },
      });

      if (invalidate) {
        queryClient.invalidateQueries({
          predicate: ({ queryKey }) => {
            const [qType, qEntity] = queryKey;

            return (
              (qType === QueryType.count || qType === QueryType.collection) &&
              isSameEntity(qEntity, entity)
            );
          },
        });
      }

      return result;
    },
    ...otherOptions,
  });
};
