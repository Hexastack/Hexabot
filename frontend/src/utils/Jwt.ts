/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TJwtPayload } from "@/types/jwt.types";

export class JWT<T extends TJwtPayload> {
  decode(token: string): T {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url?.replace("-", "+").replace("_", "/");

      return JSON.parse(window.atob(base64));
    } catch (e) {
      throw new Error("Invalid Token");
    }
  }

  isExpired({ exp }: T): boolean {
    if (exp) return exp < Date.now() / 1000;

    return true;
  }
}
