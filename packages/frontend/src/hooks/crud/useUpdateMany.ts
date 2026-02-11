/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

import { useTanstackMutation } from "./useTanstack";

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
  const { routeParams, ...otherOptions } = options || {};

  return useTanstackMutation({
    mutationFn: async ({ ids, payload }) => {
      const result = await api.updateMany(ids, payload, routeParams);

      return result;
    },
    ...otherOptions,
  });
};
