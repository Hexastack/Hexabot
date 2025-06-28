/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
