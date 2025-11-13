/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, QueryType } from "@/services/types";
import { THook } from "@/types/base.types";
import { UseQueryOptions } from "@/types/tanstack.types";

import { useEntityApiClient } from "../useApiClient";

import { useTanstackQuery } from "./useTanstack";

export const useCount = <TE extends THook["entity"]>(
  entity: TE,
  params?: Partial<THook<{ entity: TE }>["basic"]>,
  options?: Omit<
    UseQueryOptions<
      { count: number },
      Error,
      { count: number },
      [QueryType, EntityType, string]
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const api = useEntityApiClient(entity);

  return useTanstackQuery({
    ...options,
    queryFn: () => api.count({ where: params }),
    queryKey: [QueryType.count, entity, JSON.stringify(params)],
  });
};
