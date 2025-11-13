/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import axios from "axios";
import { stringify } from "qs";
import { useContext, useMemo } from "react";

import { ApiClientContext } from "@/contexts/apiClient.context";
import { useTranslate } from "@/hooks/useTranslate";
import { ApiClient, EntityApiClient, ROUTES } from "@/services/api.class";
import { THook } from "@/types/base.types";
import { IUser } from "@/types/user.types";

import { useAppRouter } from "./useAppRouter";
import { useLogoutRedirection } from "./useAuth";
import { useConfig } from "./useConfig";
import { useToast } from "./useToast";

const ME_ENDPOINT = `/api${ROUTES.ME}`;

export const useAxiosInstance = () => {
  const { apiUrl } = useConfig();
  const { logoutRedirection } = useLogoutRedirection();
  const { toast } = useToast();
  const router = useAppRouter();
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
    let timer;

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
          error.response.status === 500 &&
          error.request.responseURL.endsWith(ME_ENDPOINT)
        ) {
          clearInterval(timer);

          timer = setInterval(async () => {
            const { data } = await axiosInstance.get<IUser>(ME_ENDPOINT);

            if (data) {
              router.reload();
            }
          }, 2000);
        }

        if (error.response.status === 401) {
          await logoutRedirection(true);
        }

        return Promise.reject(error.response.data);
      },
    );

    return instance;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logoutRedirection, toast]);

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
