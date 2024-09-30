import getConfig from "next/config";
import { useRouter } from "next/router";
import { useState, useEffect, createContext, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  useQueryClient,
  useQuery,
  QueryObserverResult,
  RefetchOptions,
  UseMutateFunction,
} from "react-query";

import { Progress } from "@/app-components/displays/Progress";
import { useLogout } from "@/hooks/entities/auth-hooks";
import { useApiClient } from "@/hooks/useApiClient";
import {
  useLogoutRedirection,
  CURRENT_USER_KEY,
  PUBLIC_PATHS,
} from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { RouterType } from "@/services/types";
import { IUser } from "@/types/user.types";
import { getFromQuery } from "@/utils/URL";

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
    queryClient.removeQueries([CURRENT_USER_KEY]);
    updateLanguage(publicRuntimeConfig.lang.default);
    await logoutSession();
    logoutRedirection();
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

  useEffect(() => {
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
