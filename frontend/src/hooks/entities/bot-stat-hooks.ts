/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useQuery } from "react-query";

import { StatsType } from "@/types/bot-stat.types";

import { useApiClient } from "../useApiClient";

export const useFindStats = <T>(type: StatsType) => {
  const { apiClient } = useApiClient();

  return useQuery({
    queryKey: ["stats", type],
    queryFn: async () => {
      return await apiClient.getBotStats<T>(type);
    },
  });
};
