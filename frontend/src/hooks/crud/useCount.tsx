/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import stringify from "fast-json-stable-stringify";
import { useQuery, UseQueryOptions } from "react-query";

import { EntityType, QueryType } from "@/services/types";
import { IDynamicProps, TType } from "@/types/base.types";

import { useEntityApiClient } from "../useApiClient";

export const useCount = <TEntity extends IDynamicProps["entity"]>(
  entity: TEntity,
  params?: Partial<TType<TEntity>["basic"]>,
  options?: Omit<
    UseQueryOptions<
      { count: number },
      Error,
      { count: number },
      [QueryType, EntityType, unknown]
    >,
    "queryFn"
  >,
) => {
  const api = useEntityApiClient(entity);

  return useQuery({
    ...options,
    queryFn: () => api.count({ where: params }),
    queryKey: [QueryType.count, entity, stringify(params)],
  });
};
