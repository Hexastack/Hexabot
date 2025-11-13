/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions } from "@/services/types";
import { IBaseSchema, THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity, useNormalizeAndCache } from "./helpers";
import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useImport = <
  TE extends THook["entity"],
  TAttr extends File = File,
  TBasic extends IBaseSchema = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options: TMutationOptions<TBasic[], Error, TAttr, TBasic[]> = {},
  params: Record<string, any> = {},
) => {
  const api = useEntityApiClient<TAttr, TBasic>(entity);
  const queryClient = useTanstackQueryClient();
  const normalizeAndCache = useNormalizeAndCache<TBasic, string[], TBasic>(
    entity,
  );
  const { invalidate = true, ...rest } = options;

  return useTanstackMutation({
    mutationFn: async (variables) => {
      const data = await api.import(variables, params);
      const { result, entities } = normalizeAndCache(data);

      // Invalidate current entity count and collection
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

      return result.map((id) => entities[entity][id]);
    },
    ...rest,
  });
};
