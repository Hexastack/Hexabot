/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SetMetadata } from '@nestjs/common';

export type RoleIdentifier = string;

export const Roles = (...roles: RoleIdentifier[]) =>
  SetMetadata('roles', roles);
