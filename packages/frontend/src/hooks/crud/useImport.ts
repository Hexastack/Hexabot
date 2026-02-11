/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useNormalizeAndCache } from "./helpers";
import { useTanstackMutation } from "./useTanstack";

export const useImport = <
  TE extends THook["entity"],
  TAttr extends File = File,
  TBasic extends THook["basic"] = THook<{ entity: TE }>["basic"],
>(
  entity: TE,
  options: TMutationOptions<TBasic[], Error, TAttr, TBasic[]> = {},
  params: Record<string, any> = {},
) => {
  const api = useEntityApiClient(entity);
  const normalizeAndCache = useNormalizeAndCache<string[]>(entity);
  const { routeParams, ...rest } = options;

  return useTanstackMutation({
    mutationFn: async (variables) => {
      const data = await api.import(variables, params, routeParams);
      const { result, entities } = normalizeAndCache(data);

      return result.map((id) => entities[entity][id]) as TBasic[];
    },
    ...rest,
  });
};
