/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { useContext } from "react";

import { AuthContext } from "@/contexts/auth.context";
import { RouterType } from "@/services/types";
import { hasPublicPath } from "@/utils/URL";

import { useAppRouter } from "./useAppRouter";

export const PUBLIC_PATHS = [
  "/login",
  "/login/:token",
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
  const logoutRedirection = async (
    pathname: string,
    fullReload: boolean = false,
  ) => {
    if (!hasPublicPath(pathname)) {
      const redirectUrl = `/${RouterType.LOGIN}?redirect=${encodeURIComponent(
        pathname,
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
