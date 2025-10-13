/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UserCreateDto } from '../dto/user.dto';

export const userModels = (roles: string[]): UserCreateDto[] => {
  return [
    {
      username: 'admin',
      first_name: 'admin',
      last_name: 'admin',
      email: 'admin@admin.admin',
      password: 'adminadmin',
      roles,
      avatar: null,
    },
  ];
};
