/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
