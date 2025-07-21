/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useMutation, useQueryClient } from "react-query";

import { QueryType, TMutationOptions } from "@/services/types";
import { IBaseSchema, THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { isSameEntity, useNormalizeAndCache } from "./helpers";

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
  const queryClient = useQueryClient();
  const normalizeAndCache = useNormalizeAndCache<TBasic, string[], TBasic>(
    entity,
  );
  const { invalidate = true, ...rest } = options;

  return useMutation({
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
