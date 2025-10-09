/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

import { useBroadcastChannel } from "@/contexts/broadcast-channel.context";
import { EntityType, TMutationOptions } from "@/services/types";
import { ILoginAttributes } from "@/types/auth/login.types";
import {
  IProfileAttributes,
  IUser,
  IUserAttributes,
  IUserStub,
} from "@/types/user.types";
import { useSocket } from "@/websocket/socket-hooks";

import { useFind } from "../crud/useFind";
import { useApiClient } from "../useApiClient";
import { useAuth, useLogoutRedirection } from "../useAuth";
import { useToast } from "../useToast";
import { useTranslate } from "../useTranslate";

export const useLogin = (
  options?: TMutationOptions<IUser, Error, ILoginAttributes>,
) => {
  const { apiClient } = useApiClient();
  const { postMessage } = useBroadcastChannel();

  return useMutation({
    ...options,
    async mutationFn(credentials) {
      return await apiClient.login(credentials);
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
      postMessage({ event: "login" });
    },
  });
};

export const useLogout = (
  options?: TMutationOptions<
    {
      status: "ok";
    },
    Error
  >,
) => {
  const queryClient = useQueryClient();
  const { apiClient } = useApiClient();
  const { socket } = useSocket();
  const { logoutRedirection } = useLogoutRedirection();
  const { toast } = useToast();
  const { t } = useTranslate();
  const { postMessage } = useBroadcastChannel();

  return useMutation({
    ...options,
    async mutationFn() {
      socket?.disconnect();

      return await apiClient.logout();
    },
    onSuccess: async () => {
      queryClient.clear();
      postMessage({ event: "logout" });
      await logoutRedirection();
      toast.success(t("message.logout_success"));
    },
    onError: () => {
      toast.error(t("message.logout_failed"));
    },
  });
};

export const PERMISSIONS_STORAGE_KEY = "current-permissions";

export const useUserPermissions = () => {
  const { apiClient } = useApiClient();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    enabled: isAuthenticated,
    queryKey: [PERMISSIONS_STORAGE_KEY],
    async queryFn() {
      return await apiClient.getUserPermissions(user?.id as string);
    },
    initialData: {
      roles: [],
      permissions: [],
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      query.refetch();
    } else {
      queryClient.removeQueries([PERMISSIONS_STORAGE_KEY]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return query;
};

export const useAcceptInvite = (
  options?: TMutationOptions<
    {
      success: boolean;
    },
    Error,
    Partial<IUserAttributes> & { token: string }
  >,
) => {
  const { apiClient } = useApiClient();

  return useMutation({
    ...options,
    async mutationFn(payload) {
      return await apiClient.acceptInvite(payload);
    },
  });
};

export const useConfirmAccount = (
  options?: TMutationOptions<never, Error, { token: string }>,
) => {
  const { apiClient } = useApiClient();

  return useMutation({
    ...options,
    async mutationFn(payload) {
      return await apiClient.confirmAccount(payload);
    },
  });
};

export const useLoadSettings = () => {
  const { isAuthenticated } = useAuth();
  const { data: settings, ...rest } = useFind(
    { entity: EntityType.SETTING },
    {
      hasCount: false,
      initialSortState: [{ field: "weight", sort: "desc" }],
    },
    {
      enabled: isAuthenticated,
    },
  );

  return {
    ...rest,
    data:
      settings?.reduce((acc, curr) => {
        const group = acc[curr.group] || [];

        group.push(curr);
        acc[curr.group] = group;

        return acc;
      }, {}) || {},
  };
};

export const useUpdateProfile = (
  options?: TMutationOptions<IUserStub, Error, Partial<IProfileAttributes>>,
) => {
  const { apiClient } = useApiClient();
  const { user } = useAuth();

  return useMutation({
    ...options,
    async mutationFn(payload) {
      return await apiClient.updateProfile(user?.id as string, payload);
    },
  });
};
