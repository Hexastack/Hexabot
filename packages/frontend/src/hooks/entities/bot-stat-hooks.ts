/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StatsSummary, StatsType } from "@/types/bot-stat.types";

import { useTanstackQuery } from "../crud/useTanstack";
import { useApiClient } from "../useApiClient";

export const useFindStats = <T>(type: StatsType) => {
  const { apiClient } = useApiClient();

  return useTanstackQuery({
    queryKey: ["stats", type],
    queryFn: async () => {
      return await apiClient.getBotStats<T>(type);
    },
  });
};

export const useStatsSummary = () => {
  const { apiClient } = useApiClient();

  return useTanstackQuery({
    queryKey: ["stats", "summary"],
    queryFn: async () => {
      return await apiClient.getStatsSummary<StatsSummary>();
    },
  });
};
