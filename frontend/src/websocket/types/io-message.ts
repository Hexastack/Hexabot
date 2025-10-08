/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
