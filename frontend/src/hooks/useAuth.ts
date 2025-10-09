/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { AuthContext } from "@/contexts/auth.context";
import { useAppRouter } from "@/hooks/useAppRouter";
import { RouterType } from "@/services/types";
import { hasPublicPath } from "@/utils/URL";

export const CURRENT_USER_KEY = "current-user";
export const PUBLIC_PATHS = [
  "/login",
  "/login/:token",
  "/register/:token",
  "/reset",
  "/reset/:token",
];

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }

  return context;
};

export const useLogoutRedirection = () => {
  const router = useAppRouter();
  const logoutRedirection = async (fullReload: boolean = false) => {
    if (!hasPublicPath(router.pathname)) {
      const redirectUrl = `/${RouterType.LOGIN}?redirect=${encodeURIComponent(
        router.asPath,
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
