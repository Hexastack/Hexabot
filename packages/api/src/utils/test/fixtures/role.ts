/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { RoleCreateDto } from '@/user/dto/role.dto';
import { RoleOrmEntity as RoleEntity } from '@/user/entities/role.entity';

type RoleOrmFixture = RoleCreateDto & { id: string };

export const roleFixtureIds = {
  admin: '11111111-1111-1111-1111-111111111111',
  manager: '22222222-2222-2222-2222-222222222222',
  public: '33333333-3333-3333-3333-333333333333',
} as const;

export const roleOrmFixtures: RoleOrmFixture[] = [
  {
    id: roleFixtureIds.admin,
    name: 'admin',
    active: true,
  },
  {
    id: roleFixtureIds.manager,
    name: 'manager',
    active: true,
  },
  {
    id: roleFixtureIds.public,
    name: 'public',
    active: true,
  },
];

export const roleFixtures: RoleCreateDto[] = roleOrmFixtures.map(
  ({ id: _id, ...role }) => role,
);

export const installRoleFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(RoleEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(roleOrmFixtures);
  return await repository.save(entities);
};
