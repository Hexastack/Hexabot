/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useQuery, UseQueryOptions } from "react-query";

import { EntityType, QueryType } from "@/services/types";
import { THook } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

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
    "queryFn"
  >,
) => {
  const api = useEntityApiClient(entity);

  return useQuery({
    ...options,
    queryFn: () => api.count({ where: params }),
    queryKey: [QueryType.count, entity, JSON.stringify(params)],
  });
};
