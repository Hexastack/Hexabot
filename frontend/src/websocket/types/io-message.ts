/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

export interface IOIncomingMessage<T = any> {
  statusCode: number;
  body: T;
  headers: Record<string, string>;
}

export interface IOOutgoingMessage<T = any> {
  method: "get" | "post" | "put" | "delete" | "patch" | "options" | "head";
  headers: Record<string, string>;
  data: T;
  // params: Record<string, any>;
  url: string;
}
