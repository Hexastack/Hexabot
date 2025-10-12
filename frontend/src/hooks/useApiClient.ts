/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import axios from "axios";
import { stringify } from "qs";
import { useContext, useMemo } from "react";

import { ApiClientContext } from "@/contexts/apiClient.context";
import { useTranslate } from "@/hooks/useTranslate";
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
  const { t } = useTranslate();
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
      async (error) => {
        if (!error.response) {
          // Optionally redirect to an error page or show a notification
          toast.error(t("message.network_error"));

          return Promise.reject(new Error("Network error"));
        }
        if (error.response.status === 401) {
          await logoutRedirection(true);
        }

        return Promise.reject(error.response.data);
      },
    );

    return instance;
  }, [logoutRedirection, toast]);

  return axiosInstance;
};

export const entityApiClients = new Map();

export const getApiClientByEntity = <
  TAttr,
  TStub extends IBaseSchema,
  TFull = never,
>(
  type: EntityType,
  apiClient: ApiClient,
) => {
  if (!entityApiClients.has(type)) {
    const client = apiClient.buildEntityClient<TAttr, TStub, TFull>(type);

    entityApiClients.set(type, client);
  }

  return entityApiClients.get(type) as EntityApiClient<TAttr, TStub, TFull>;
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
