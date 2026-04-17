/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type ReactNode, useCallback, useEffect } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { runtimeConfig } from "@/config/runtime";
import { AuthContext } from "@/contexts/auth.context";
import { useGet } from "@/hooks/crud/useGet";
import {
  useTanstackQuery,
  useTanstackQueryClient,
} from "@/hooks/crud/useTanstack";
import { useLogout } from "@/hooks/entities/auth-hooks";
import { useApiClient } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
import { CURRENT_USER_KEY } from "@/hooks/useAuth";
import { useSubscribeBroadcastChannel } from "@/hooks/useSubscribeBroadcastChannel";
import { useTranslate } from "@/hooks/useTranslate";
import { EntityType, QueryType } from "@/services/types";
import { type IUser } from "@/types/user.types";

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const router = useAppRouter();
  const { i18n } = useTranslate();
  const queryClient = useTanstackQueryClient();
  const updateLanguage = useCallback(
    async (lang: string) => {
      const activeLanguage = i18n.resolvedLanguage || i18n.language;

      if (!lang || activeLanguage === lang) {
        return;
      }

      await i18n.changeLanguage(lang);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QueryType.item, EntityType.SETTING, "schemas"],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryType.collection, EntityType.WORKFLOW_ACTIONS],
        }),
        queryClient.invalidateQueries({
          queryKey: ["workflow-bindings"],
        }),
      ]);
    },
    [i18n, queryClient],
  );
  const { mutate: logoutSession } = useLogout();
  const logout = async () => {
    await updateLanguage(runtimeConfig.lang.default);
    logoutSession();
  };
  const { apiClient } = useApiClient();
  const { data, error, isLoading, refetch } = useTanstackQuery<IUser, Error>({
    queryFn: () => apiClient.getCurrentSession(),
    queryKey: [CURRENT_USER_KEY],
  });
  const { data: user } = useGet(
    data?.id || "",
    { entity: EntityType.USER },
    { enabled: !!data?.id },
  );

  useEffect(() => {
    if (user?.language) {
      void updateLanguage(user.language);
    }
  }, [updateLanguage, user?.language]);

  const setUser = (data?: IUser) => {
    queryClient.setQueryData([CURRENT_USER_KEY], data);
  };
  const authenticate = (user: IUser) => {
    void updateLanguage(user.language);
    setUser(user);
  };
  const refetchUser = useCallback(async () => {
    const result = await refetch();

    return result.data;
  }, [refetch]);

  useSubscribeBroadcastChannel("login", () => {
    router.reload();
  });

  useSubscribeBroadcastChannel("logout", () => {
    router.reload();
  });

  if (isLoading) {
    return <Progress />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        error,
        setUser,
        authenticate,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
