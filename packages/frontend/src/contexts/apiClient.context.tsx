/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import axios from "axios";
import { createContext, ReactNode, FC } from "react";

import { getApiClientByEntity, useAxiosInstance } from "@/hooks/useApiClient";
import { ApiClient, EntityApiClient } from "@/services/api.class";
import { EntityType } from "@/services/types";
import { IBaseSchema } from "@/types/base.types";

interface ApiClientContextProps {
  children: ReactNode;
}

export interface ApiClientContext {
  apiClient: ApiClient;
  getApiClientByEntity: <TAttr, TStub extends IBaseSchema, TFull = never>(
    type: EntityType,
  ) => EntityApiClient<TAttr, TStub, TFull>;
}

export const ApiClientContext = createContext<ApiClientContext>({
  apiClient: new ApiClient(axios.create()),
  getApiClientByEntity: () => {
    throw new Error(
      "getApiClientByEntity must be used within an ApiClientProvider",
    );
  },
});

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
