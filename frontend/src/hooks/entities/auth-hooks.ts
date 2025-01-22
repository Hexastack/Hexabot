/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";

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
import { CURRENT_USER_KEY, useAuth, useLogoutRedirection } from "../useAuth";

export const useLogin = (
  options?: Omit<
    TMutationOptions<IUser, Error, ILoginAttributes>,
    "mutationFn"
  >,
) => {
  const { apiClient } = useApiClient();

  return useMutation({
    ...options,
    async mutationFn(credentials) {
      return await apiClient.login(credentials);
    },
  });
};

export const useLogout = (
  options?: Omit<
    TMutationOptions<
      {
        status: "ok";
      },
      Error
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { apiClient } = useApiClient();
  const { socket } = useSocket();
  const { logoutRedirection } = useLogoutRedirection();

  return useMutation({
    ...options,
    async mutationFn() {
      socket?.disconnect();

      return await apiClient.logout();
    },
    onSuccess: async () => {
      queryClient.removeQueries([CURRENT_USER_KEY]);
      await logoutRedirection();
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
  options?: Omit<
    TMutationOptions<
      {
        success: boolean;
      },
      Error,
      Partial<IUserAttributes> & { token: string }
    >,
    "mutationFn"
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
  options?: Omit<
    TMutationOptions<never, Error, { token: string }>,
    "mutationFn"
  >,
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
  options?: Omit<
    TMutationOptions<IUserStub, Error, Partial<IProfileAttributes>>,
    "mutationFn"
  >,
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
