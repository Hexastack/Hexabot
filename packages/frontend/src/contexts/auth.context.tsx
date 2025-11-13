/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createContext, ReactNode, useEffect } from "react";

import { Progress } from "@/app-components/displays/Progress";
import { runtimeConfig } from "@/config/runtime";
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
import { RouterType } from "@/services/types";
import {
  QueryObserverResult,
  RefetchOptions,
  UseMutateFunction,
} from "@/types/tanstack.types";
import { IUser } from "@/types/user.types";
import { hasPublicPath, isLoginPath } from "@/utils/URL";

export interface AuthContextValue {
  user: IUser | undefined;
  isAuthenticated: boolean;
  setUser: (data: IUser | undefined) => void;
  authenticate: (user: IUser) => void;
  logout: UseMutateFunction;
  refetchUser: (
    options?: RefetchOptions | undefined,
  ) => Promise<QueryObserverResult<IUser, Error>>;
  error: Error | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

AuthContext.displayName = "AuthContext";

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const router = useAppRouter();
  const { i18n } = useTranslate();
  const queryClient = useTanstackQueryClient();
  const updateLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const { mutate: logoutSession } = useLogout();
  const logout = async () => {
    updateLanguage(runtimeConfig.lang.default);
    logoutSession();
  };
  const authRedirection = async (isAuthenticated: boolean) => {
    if (isAuthenticated && router.routeObject.handle?.isPublicRoute) {
      await router.push(RouterType.HOME);
    }

    if (isAuthenticated && isLoginPath(router.pathname)) {
      const rawRedirect = router.query.redirect;
      const redirectUrl = Array.isArray(rawRedirect)
        ? rawRedirect.at(-1)
        : rawRedirect;

      if (redirectUrl?.startsWith("/") && !hasPublicPath(redirectUrl)) {
        await router.push(redirectUrl);
      } else {
        await router.push(RouterType.HOME);
      }
    }
  };
  const { apiClient } = useApiClient();
  const {
    data: user,
    error,
    isLoading,
    refetch,
    isSuccess,
  } = useTanstackQuery<IUser, Error>({
    queryKey: [CURRENT_USER_KEY],
    queryFn: async () => {
      return await apiClient.getCurrentSession();
    },
  });
  const setUser = (data?: IUser) => {
    queryClient.setQueryData([CURRENT_USER_KEY], data);
  };
  const authenticate = (user: IUser) => {
    updateLanguage(user.language);
    setUser(user);
  };
  const isAuthenticated = !!user;

  useSubscribeBroadcastChannel("login", () => {
    router.reload();
  });

  useSubscribeBroadcastChannel("logout", () => {
    router.reload();
  });

  useEffect(() => {
    if (isSuccess) {
      updateLanguage(user.language);
      authRedirection(!!user.id);
    }
  }, [isSuccess, user]);

  if (isLoading) {
    return <Progress />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!isAuthenticated,
        error,
        setUser,
        authenticate,
        refetchUser: refetch,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
