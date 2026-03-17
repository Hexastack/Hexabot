/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";
import { IMcpServerDiagnostics } from "@/types/mcp-server.types";

import { useTanstackMutation } from "../crud/useTanstack";
import { useApiClient } from "../useApiClient";

export const useTestMcpServer = (
  options?: TMutationOptions<IMcpServerDiagnostics, Error, string>,
) => {
  const { apiClient } = useApiClient();

  return useTanstackMutation({
    ...options,
    async mutationFn(id) {
      return await apiClient.testMcpServer(id);
    },
  });
};
