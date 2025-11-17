/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity } from "./helpers";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useUpdateMany = <
  TE extends THook["entity"],
  TAttr extends THook["attributes"] = THook<{ entity: TE }>["attributes"],
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<
    string,
    Error,
    {
      ids: string[];
      payload: Partial<TAttr>;
    },
    TBasic
  >,
) => {
  const api = useEntityApiClient(entity);
  const queryClient = useTanstackQueryClient();
  const { invalidate = true, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async ({ ids, payload }) => {
      const result = await api.updateMany(ids, payload);

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
