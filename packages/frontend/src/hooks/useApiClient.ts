/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";
import { stringify } from "qs";
import { useContext, useMemo } from "react";

import { ApiClientContext } from "@/contexts/apiClient.context";
import { useTranslate } from "@/hooks/useTranslate";
import { ApiClient, EntityApiClient } from "@/services/api.class";
import { QueryType, TMutationOptions } from "@/services/types";
import { THook } from "@/types/base.types";
import { isLoginPath } from "@/utils/URL";

import { useTanstackMutation, useTanstackQuery } from "./crud/useTanstack";
import { useLogoutRedirection } from "./useAuth";
import { useConfig } from "./useConfig";
import { useToast } from "./useToast";

export const useAxiosInstance = () => {
  const { apiUrl } = useConfig();
  const { logoutRedirection } = useLogoutRedirection();
  const { toast } = useToast();
  const { i18n, t } = useTranslate();
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: apiUrl,
      withCredentials: true,
    });
    const currentLanguage = i18n.resolvedLanguage || i18n.language;

    if (currentLanguage) {
      instance.defaults.headers.common["Accept-Language"] = currentLanguage;
    }
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

    instance.interceptors.request.use((requestConfig) => {
      const activeLanguage = i18n.resolvedLanguage || i18n.language;

      if (activeLanguage) {
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers["Accept-Language"] = activeLanguage;
      }

      return requestConfig;
    });

    // Response Interceptor
    instance.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        if (!error.response) {
          // Optionally redirect to an error page or show a notification
          toast.error(t("message.network_error"));

          return Promise.reject(new Error("Network error"));
        }

        if (
          error.response.status === 401 &&
          !isLoginPath(window.location.pathname)
        ) {
          await logoutRedirection(
            `${window.location.pathname}${window.location.search}`,
            true,
          );
        }

        return Promise.reject(error.response.data);
      },
    );

    return instance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, i18n, logoutRedirection, t, toast]);

  return axiosInstance;
};

export const entityApiClients = new Map();

export const getApiClientByEntity = <TE extends THook["entity"]>(
  entity: TE,
  apiClient: ApiClient,
) => {
  if (!entityApiClients.has(entity)) {
    const client = apiClient.buildEntityClient<TE>(entity);

    entityApiClients.set(entity, client);
  }

  return entityApiClients.get(entity) as EntityApiClient<TE>;
};

export const useApiClient = (): ApiClientContext => {
  const context = useContext(ApiClientContext);

  if (!context) {
    throw new Error("useApiClient must be used within an ApiClientContext");
  }

  return context;
};

export const useEntityApiClient = <TE extends THook["entity"]>(entity: TE) => {
  const { getApiClientByEntity } = useApiClient();

  return getApiClientByEntity(entity);
};

export const useApiClientQuery = <
  N extends keyof ApiClient,
  F extends ApiClient[N],
>(
  methodName: N,
  options?: UseQueryOptions<Awaited<ReturnType<F>>, Error>,
) => {
  const { apiClient } = useApiClient();

  return useTanstackQuery({
    ...options,
    queryKey: [QueryType.item, methodName],
    queryFn: () => (apiClient[methodName] as Function)(),
  });
};

export const useApiClientMutation = <
  N extends keyof ApiClient,
  F extends ApiClient[N],
>(
  methodName: N,
  options?: TMutationOptions<Awaited<ReturnType<F>>, Error, Parameters<F>>,
) => {
  const { apiClient } = useApiClient();

  return useTanstackMutation({
    ...options,
    mutationKey: [QueryType.item, methodName],
    mutationFn: (variables) =>
      (apiClient[methodName] as Function)(...variables),
  });
};
