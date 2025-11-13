/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";

import { useTanstackMutation } from "../crud/useTanstack";
import { useApiClient } from "../useApiClient";

export const useRefreshTranslations = (
  options?: TMutationOptions<
    {
      acknowledged: boolean;
      deletedCount: number;
    },
    Error,
    unknown
  >,
) => {
  const { apiClient } = useApiClient();

  return useTanstackMutation({
    ...options,
    async mutationFn() {
      return await apiClient.refreshTranslations();
    },
  });
};
