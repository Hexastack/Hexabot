/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useTanstackMutation } from "./useTanstack";

export const useDeleteMany = <
  TE extends THook["entity"],
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options?: TMutationOptions<string, Error, string[], TBasic>,
) => {
  const api = useEntityApiClient(entity);
  const { routeParams, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async (ids) => {
      const result = await api.deleteMany(ids, routeParams);

      return result;
    },
    ...otherOptions,
  });
};
