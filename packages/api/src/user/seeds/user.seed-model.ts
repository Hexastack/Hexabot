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
      firstName: 'admin',
      lastName: 'admin',
      email: 'admin@admin.admin',
      password: 'adminadmin',
      roles,
      avatar: null,
      locale: null,
      timezone: 0,
      gender: null,
      country: null,
      foreignId: '',
      labels: [],
      assignedTo: null,
      assignedAt: null,
      lastvisit: null,
      retainedFrom: null,
      channel: {
        name: 'console-channel',
      },
    },
  ];
};
