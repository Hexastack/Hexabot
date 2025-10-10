/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export type UserInfo = {
  sub: string;
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  roles?: string[];
};
