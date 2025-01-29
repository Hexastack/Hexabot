/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import getConfig from "next/config";
import { useRouter } from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import {
  QueryObserverResult,
  RefetchOptions,
  UseMutateFunction,
  useQuery,
  useQueryClient,
} from "react-query";

import { Progress } from "@/app-components/displays/Progress";
import { useLogout } from "@/hooks/entities/auth-hooks";
import { useApiClient } from "@/hooks/useApiClient";
import { CURRENT_USER_KEY, PUBLIC_PATHS } from "@/hooks/useAuth";
import { useTranslate } from "@/hooks/useTranslate";
import { RouterType } from "@/services/types";
import { IUser } from "@/types/user.types";
import { getFromQuery } from "@/utils/URL";

import { useBroadcastChannel } from "./broadcast-channel.context";

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

const { publicRuntimeConfig } = getConfig();

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const hasPublicPath = PUBLIC_PATHS.includes(router.pathname);
  const { i18n } = useTranslate();
  const [isReady, setIsReady] = useState(false);
  const queryClient = useQueryClient();
  const updateLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };
  const { mutate: logoutSession } = useLogout();
  const logout = async () => {
    updateLanguage(publicRuntimeConfig.lang.default);
    logoutSession();
  };
  const authRedirection = async (isAuthenticated: boolean) => {
    if (isAuthenticated) {
      const redirect = getFromQuery({ search, key: "redirect" });
      const nextPage = redirect && decodeURIComponent(redirect);

      if (nextPage?.startsWith("/")) {
        await router.push(nextPage);
      } else if (hasPublicPath) {
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

  useEffect(() => {
    const search = location.search;

    setSearch(search);
    setIsReady(true);
  }, []);

  const { subscribe } = useBroadcastChannel();

  subscribe((message) => {
    if (message.data === "logout") {
      router.reload();
    }
  });

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
