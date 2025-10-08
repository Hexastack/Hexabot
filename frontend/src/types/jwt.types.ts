/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

export type TJwtPayload = {
  email: string;
  roles: [];
  iat: number;
  exp: number;
};
