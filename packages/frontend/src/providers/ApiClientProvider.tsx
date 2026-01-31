/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { FC, ReactNode } from "react";

import { ApiClientContext } from "@/contexts/apiClient.context";
import { getApiClientByEntity, useAxiosInstance } from "@/hooks/useApiClient";
import { ApiClient } from "@/services/api.class";

interface ApiClientContextProps {
  children: ReactNode;
}

export const ApiClientProvider: FC<ApiClientContextProps> = ({ children }) => {
  const axiosInstance = useAxiosInstance();
  const apiClient = new ApiClient(axiosInstance);

  return (
    <ApiClientContext.Provider
      value={{
        apiClient,
        getApiClientByEntity: (type) => getApiClientByEntity(type, apiClient),
      }}
    >
      {children}
    </ApiClientContext.Provider>
  );
};
