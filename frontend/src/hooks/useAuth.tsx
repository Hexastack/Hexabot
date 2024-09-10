/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import getConfig from "next/config";
import { useRouter } from "next/router";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  QueryObserverResult,
  RefetchOptions,
  UseMutateFunction,
  useQuery,
  useQueryClient,
} from "react-query";

import { Progress } from "@/app-components/displays/Progress";
import { RouterType } from "@/services/types";
import { IUser } from "@/types/user.types";
import { getFromQuery } from "@/utils/URL";

import { useLogout } from "./entities/auth-hooks";
import { useApiClient } from "./useApiClient";
import { useToast } from "./useToast";

const { publicRuntimeConfig } = getConfig();

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

const AuthContext = createContext<AuthContextValue | null>(null);

AuthContext.displayName = "AuthContext";

export interface AuthProviderProps {
  children: ReactNode;
}

const PUBLIC_PATHS = [
  "/login/[[...token]]",
  "/register/[token]",
  "/reset/[token]",
  "/reset",
];

export const CURRENT_USER_KEY = "current-user";

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const router = useRouter();
  const { logoutRedirection } = useLogoutRedirection();
  const [search, setSearch] = useState("");
  const hasPublicPath = PUBLIC_PATHS.includes(router.pathname);
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();
  const updateLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const { mutateAsync: logoutSession } = useLogout();
  const logout = async () => {
    logoutRedirection();
    queryClient.removeQueries([CURRENT_USER_KEY]);
    updateLanguage(publicRuntimeConfig.lang.default);
    await logoutSession();
    toast.success(t("message.logout_success"));
  };
  const authRedirection = async (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      const redirect = getFromQuery({ search, key: "redirect" });
      const nextPage = redirect && decodeURIComponent(redirect);

      if (nextPage?.startsWith("/")) {
        router.push(nextPage);
      } else if (hasPublicPath) router.push(RouterType.HOME);
    }
  };
  const { apiClient } = useApiClient();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<IUser, Error>({
    queryKey: [CURRENT_USER_KEY],
    queryFn: async () => {
      return await apiClient.getCurrentSession();
    },
    onSuccess(data) {
      updateLanguage(data.language);
      authRedirection(!!data?.id);
    },
  });
  const setUser = (data?: IUser) => {
    queryClient.setQueryData(CURRENT_USER_KEY, data);
  };
  const authenticate = (user: IUser) => {
    updateLanguage(user.language);
    setUser(user);
  };
  const isAuthenticated = !!user;

  React.useEffect(() => {
    const search = location.search;

    setSearch(search);
    setIsReady(true);
  }, []);

  if (!isReady || isLoading) return <Progress />;

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

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }

  return context;
};

export const useLogoutRedirection = () => {
  const router = useRouter();
  const hasPublicPath = PUBLIC_PATHS.includes(router.pathname);
  const logoutRedirection = async (fullReload: boolean = false) => {
    if (!hasPublicPath) {
      const redirectUrl = `/${RouterType.LOGIN}?redirect=${encodeURIComponent(
        router.pathname,
      )}`;

      if (fullReload) {
        window.location.replace(redirectUrl);
      } else {
        await router.replace(redirectUrl);
      }
    }
  };

  return { logoutRedirection };
};
