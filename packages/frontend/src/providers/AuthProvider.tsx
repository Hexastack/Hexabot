/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { type ReactNode, useCallback, useEffect, useMemo } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { runtimeConfig } from "@/config/runtime";
import { AuthContext } from "@/contexts/auth.context";
import { useGet } from "@/hooks/crud/useGet";
import { useTanstackQueryClient } from "@/hooks/crud/useTanstack";
import { useLogout } from "@/hooks/entities/auth-hooks";
import { useApiClientQuery } from "@/hooks/useApiClient";
import { useAppRouter } from "@/hooks/useAppRouter";
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
  const {
    data: me,
    error,
    isLoading,
    refetch,
  } = useApiClientQuery("getCurrentSession");
  const { data: user } = useGet(
    me?.id || "",
    { entity: EntityType.USER },
    {
      enabled: !!me?.id,
    },
  );
  const userWithLicense = useMemo(
    () => ({ ...user, license: me?.license }) as typeof me,
    [me, user],
  );

  useEffect(() => {
    if (user?.language) {
      void updateLanguage(user.language);
    }
  }, [updateLanguage, user?.language]);
  const authenticate = (user: IUser) => {
    void updateLanguage(user.language);
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

  if (isLoading || !userWithLicense) {
    return <Progress />;
  }

  return (
    <AuthContext.Provider
      value={{
        user: userWithLicense,
        isAuthenticated: !!user,
        error,
        authenticate,
        refetchUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
