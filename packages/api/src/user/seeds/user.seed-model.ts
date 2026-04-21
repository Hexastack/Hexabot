/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UserCreateDto } from '../dto/user.dto';

const resolveSeedValue = (key: string, fallback: string) => {
  return process.env[key]?.trim() || fallback;
};
const resolveSeedAdminEmail = () => {
  return resolveSeedValue('SEED_ADMIN_EMAIL', 'admin@admin.admin');
};
const resolveSeedAdminUsername = (email: string) => {
  const localPart = email.split('@')[0]?.trim().toLowerCase() || '';
  const normalized = localPart.replace(/[^a-z0-9._-]/g, '');

  return normalized || 'admin';
};

export const userModels = (roles: string[]): UserCreateDto[] => {
  const firstName = resolveSeedValue('SEED_ADMIN_FIRST_NAME', 'admin');
  const lastName = resolveSeedValue('SEED_ADMIN_LAST_NAME', 'admin');
  const email = resolveSeedAdminEmail();
  const password = resolveSeedValue('SEED_ADMIN_PASSWORD', 'adminadmin');

  return [
    {
      username: resolveSeedAdminUsername(email),
      firstName,
      lastName,
      email,
      password,
      roles,
      avatar: null,
    },
  ];
};
