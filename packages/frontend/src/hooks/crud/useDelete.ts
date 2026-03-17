/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { QueryType, TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useTanstackMutation, useTanstackQueryClient } from "./useTanstack";

export const useDelete = <
  TE extends THook["entity"],
  TBasic = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<string, Error, string, TBasic>,
) => {
  const api = useEntityApiClient(entity);
  const { routeParams, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async (id) => {
      const result = await api.delete(id, routeParams);

      return result;
    },
    ...otherOptions,
  });
};

export const useDeleteFromCache = <TE extends THook["entity"]>(entity: TE) => {
  const queryClient = useTanstackQueryClient();

  return (id: string) => {
    queryClient.removeQueries({
      predicate: ({ queryKey }) => {
        const [qType, qEntity, qId] = queryKey;

        return qType === QueryType.item && qEntity === entity && qId === id;
      },
    });
  };
};
