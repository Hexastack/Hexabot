/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { hashSync } from 'bcryptjs';

import { config } from '@/config';

export const hash = (plainPassword: string) =>
  hashSync(plainPassword, config.authentication.jwtOptions.salt);
