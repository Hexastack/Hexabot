/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { PUBLIC_PATHS } from "@/hooks/useAuth";
import { RouterType } from "@/services/types";

export const buildURL = (baseUrl: string, relativePath: string): string => {
  try {
    return new URL(relativePath).toString();
  } catch {
    try {
      return new URL(
        relativePath.replace(/^\//, ""),
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      ).toString();
    } catch {
      throw new Error(`Invalid base URL: ${baseUrl}`);
    }
  }
};

export const isAbsoluteUrl = (value: string = ""): boolean => {
  try {
    const url = new URL(value);
    const hostnameParts = url.hostname.split(".");

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      ((url.href.startsWith("http://") && value.startsWith("http://")) ||
        (url.href.startsWith("https://") && value.startsWith("https://"))) &&
      hostnameParts.length > 1 &&
      hostnameParts[hostnameParts.length - 1].length > 1
    );
  } catch (error) {
    return false;
  }
};

export const getStaticPath = (pathname: string) => {
  return pathname.includes("[")
    ? pathname.split("[")[0].slice(0, -1)
    : pathname;
};

export const isLoginPath = (pathname: string) => {
  return getStaticPath(pathname) === `/${RouterType.LOGIN}`;
};

export const hasPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.some(
    (path) => getStaticPath(path) === getStaticPath(pathname),
  );
};
