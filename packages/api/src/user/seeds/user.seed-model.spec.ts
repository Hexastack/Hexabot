/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { userModels } from './user.seed-model';

const ENV_KEYS = [
  'SEED_ADMIN_FIRST_NAME',
  'SEED_ADMIN_LAST_NAME',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
];

describe('userModels', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  it('uses fallback admin values when no env overrides are provided', () => {
    const [seeded] = userModels(['admin-role']);

    expect(seeded).toMatchObject({
      username: 'admin',
      firstName: 'admin',
      lastName: 'admin',
      email: 'admin@admin.admin',
      password: 'adminadmin',
      roles: ['admin-role'],
      avatar: null,
    });
  });

  it('uses env overrides and infers username from email', () => {
    process.env.SEED_ADMIN_FIRST_NAME = 'Anis';
    process.env.SEED_ADMIN_LAST_NAME = 'Bot';
    process.env.SEED_ADMIN_EMAIL = 'Anis.Bot+Owner@example.com';
    process.env.SEED_ADMIN_PASSWORD = 'Admin#123';

    const [seeded] = userModels(['admin-role']);

    expect(seeded).toMatchObject({
      username: 'anis.botowner',
      firstName: 'Anis',
      lastName: 'Bot',
      email: 'Anis.Bot+Owner@example.com',
      password: 'Admin#123',
    });
  });

  it('falls back to admin username when email local-part is unusable', () => {
    process.env.SEED_ADMIN_EMAIL = '+@example.com';

    const [seeded] = userModels(['admin-role']);

    expect(seeded.username).toBe('admin');
  });
});
