/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity, useNormalizeAndCache } from "./helpers";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useCreate = <
  TE extends THook["entity"],
  TAttr extends THook["attributes"] = THook<{
    entity: TE;
  }>["attributes"],
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<TBasic, Error, TAttr, TBasic>,
) => {
  const api = useEntityApiClient(entity);
  const queryClient = useTanstackQueryClient();
  const normalizeAndCache = useNormalizeAndCache<string>(entity);
  const { invalidate = true, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async (variables) => {
      const data = await api.create(variables);
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
