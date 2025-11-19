/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

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
import {
  useTanstackMutation,
  useTanstackQuery,
  useTanstackQueryClient,
} from "../crud/useTanstack";
import { useApiClient } from "../useApiClient";
import { useAuth, useLogoutRedirection } from "../useAuth";
import { useToast } from "../useToast";
import { useTranslate } from "../useTranslate";

export const useLogin = (
  options?: TMutationOptions<IUser, Error, ILoginAttributes>,
) => {
  const { apiClient } = useApiClient();
  const { postMessage } = useBroadcastChannel();

  return useTanstackMutation({
    ...options,
    async mutationFn(credentials) {
      return await apiClient.login(credentials);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      options?.onSuccess?.(data, variables, onMutateResult, context);
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
  const queryClient = useTanstackQueryClient();
  const { apiClient } = useApiClient();
  const { socket } = useSocket();
  const { logoutRedirection } = useLogoutRedirection();
  const { toast } = useToast();
  const { t } = useTranslate();
  const { postMessage } = useBroadcastChannel();

  return useTanstackMutation({
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

export const useUserPermissions = () => {
  const { apiClient } = useApiClient();
  const { user, isAuthenticated } = useAuth();

  return useTanstackQuery({
    queryKey: ["readonly-user-permissions"],
    queryFn: () => apiClient.getUserPermissions(user?.id!),
    enabled: isAuthenticated,
  });
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

  return useTanstackMutation({
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

  return useTanstackMutation({
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

  return useTanstackMutation({
    ...options,
    async mutationFn(payload) {
      return await apiClient.updateProfile(user?.id as string, payload);
    },
  });
};
