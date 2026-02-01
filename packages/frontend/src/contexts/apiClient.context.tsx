/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import axios from "axios";
import { createContext } from "react";

import { ApiClient, EntityApiClient } from "@/services/api.class";
import { type THook } from "@/types/base.types";

export interface ApiClientContext {
  apiClient: ApiClient;
  getApiClientByEntity: <TE extends THook["entity"]>(
    entity: TE,
  ) => EntityApiClient<TE>;
}

export const ApiClientContext = createContext<ApiClientContext>({
  apiClient: new ApiClient(axios.create()),
  getApiClientByEntity: () => {
    throw new Error(
      "getApiClientByEntity must be used within an ApiClientProvider",
    );
  },
});
