/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TMutationOptions } from "@/services/types";
import { IResetPayload, IResetRequest } from "@/types/reset.types";

import { useTanstackMutation } from "../crud/useTanstack";
import { useApiClient } from "../useApiClient";

export const useRequestResetPassword = (
  options?: TMutationOptions<void, Error, IResetRequest, unknown>,
) => {
  const { apiClient } = useApiClient();

  return useTanstackMutation<void, Error, IResetRequest>({
    ...options,
    mutationFn: async (payload) => {
      return await apiClient.requestReset(payload);
    },
  });
};

export const useResetPassword = (
  token: string,
  options?: TMutationOptions<void, Error, IResetPayload, unknown>,
) => {
  const { apiClient } = useApiClient();

  return useTanstackMutation<void, Error, IResetPayload>({
    ...options,
    mutationFn: async (payload) => {
      return await apiClient.reset(token, payload);
    },
  });
};
