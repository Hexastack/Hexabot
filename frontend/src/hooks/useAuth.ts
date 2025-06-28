/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { useRouter } from "next/router";
import { useContext } from "react";

import { AuthContext } from "@/contexts/auth.context";
import { RouterType } from "@/services/types";
import { hasPublicPath } from "@/utils/URL";

export const CURRENT_USER_KEY = "current-user";
export const PUBLIC_PATHS = [
  "/login/[[...token]]",
  "/register/[token]",
  "/reset/[token]",
];

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }

  return context;
};

export const useLogoutRedirection = () => {
  const router = useRouter();
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
