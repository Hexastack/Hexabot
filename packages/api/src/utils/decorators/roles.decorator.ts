/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SetMetadata } from '@nestjs/common';

import { TRole } from '@/user/schemas/role.schema';

export const Roles = (...roles: TRole[]) => SetMetadata('roles', roles);
