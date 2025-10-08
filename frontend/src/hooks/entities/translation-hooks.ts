/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { useMutation } from "react-query";

import { TMutationOptions } from "@/services/types";

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

  return useMutation({
    ...options,
    async mutationFn() {
      return await apiClient.refreshTranslations();
    },
  });
};
