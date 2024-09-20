/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import axios from "axios";
import { stringify } from "qs";
import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ApiClient, EntityApiClient } from "@/services/api.class";
import { EntityType } from "@/services/types";
import { IBaseSchema } from "@/types/base.types";

import { useLogoutRedirection } from "./useAuth";
import { useConfig } from "./useConfig";
import { useToast } from "./useToast";

export const useAxiosInstance = () => {
  const { apiUrl } = useConfig();
  const { logoutRedirection } = useLogoutRedirection();
  const { toast } = useToast();
  const { t } = useTranslation();
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
    });
    // Added the same Query String (de)Serializer as NestJS,

    instance.defaults.paramsSerializer = function (params) {
      // config was made with trial and error and reading the docs
      return stringify(params, {
        arrayFormat: "indices",
        charsetSentinel: false,
        skipNulls: true,
        charset: "utf-8",
      });
    };

    // Response Interceptor
    instance.interceptors.response.use(
      (resp) => resp,
      (error) => {
        if (!error.response) {
          // Optionally redirect to an error page or show a notification
          toast.error(t("message.network_error"));

          return Promise.reject(new Error("Network error"));
        }
        if (error.response.status === 401) {
          logoutRedirection(true);
        }

        return Promise.reject(error.response.data);
      },
    );

    return instance;
  }, [logoutRedirection, toast]);

  return axiosInstance;
};

interface ApiClientContextProps {
  children: ReactNode;
}

export const entityApiClients = new Map();

interface ApiClientContext {
  apiClient: ApiClient;
  getApiClientByEntity: <TAttr, TStub extends IBaseSchema, TFull = never>(
    type: EntityType,
  ) => EntityApiClient<TAttr, TStub, TFull>;
}

const getApiClientByEntity = <TAttr, TStub extends IBaseSchema, TFull = never>(
  type: EntityType,
  apiClient: ApiClient,
) => {
  if (!entityApiClients.has(type)) {
    const client = apiClient.buildEntityClient<TAttr, TStub, TFull>(type);

    entityApiClients.set(type, client);
  }

  return entityApiClients.get(type) as EntityApiClient<TAttr, TStub, TFull>;
};
const ApiClientContext = createContext<ApiClientContext>({
  apiClient: new ApiClient(axios.create()),
  getApiClientByEntity: () => {
    throw new Error(
      "getApiClientByEntity must be used within an ApiClientProvider",
    );
  },
});

export const ApiClientProvider: React.FC<ApiClientContextProps> = ({
  children,
}) => {
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

export const useApiClient = (): ApiClientContext => {
  const context = useContext(ApiClientContext);

  if (!context) {
    throw new Error("useApiClient must be used within an ApiClientContext");
  }

  return context;
};

export const useEntityApiClient = <
  TAttr,
  TStub extends IBaseSchema,
  TFull = never,
>(
  type: EntityType,
) => {
  const { getApiClientByEntity } = useApiClient();

  return getApiClientByEntity<TAttr, TStub, TFull>(type);
};
