/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useQuery, UseQueryOptions } from "react-query";

import { useApiClient } from "@/hooks/useApiClient";
import { ROUTES } from "@/services/api.class";
import { IBlockSearchResult } from "@/types/block.types";

export const useSearchBlocks = (
  q: string,
  limit = 50,
  categoryId?: string,
  options?: UseQueryOptions<IBlockSearchResult[], Error>,
) => {
  const { apiClient } = useApiClient();

  return useQuery<IBlockSearchResult[], Error>({
    queryKey: [ROUTES.BlockSearch, q, limit, categoryId],
    queryFn: async () => {
      if (!q?.trim()) return [];

      return await apiClient.getBlockSearchResults(q, limit, categoryId);
    },
    enabled: Boolean(q && q.trim().length > 0),
    keepPreviousData: true,
    staleTime: 30_000,
    ...options,
  });
};
