/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { User, UserCreateDto } from '@/user/dto/user.dto';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { hash } from '@/user/utilities/bcryptjs';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

import { installRoleFixturesTypeOrm, roleFixtureIds } from './role';

export const users: UserCreateDto[] = [
  {
    username: 'admin',
    first_name: 'admin',
    last_name: 'admin',
    email: 'admin@admin.admin',
    password: 'adminadmin',
    roles: [roleFixtureIds.admin, roleFixtureIds.manager],
    avatar: null,
  },
];

export const userDefaultValues: TFixturesDefaultValues<User> = {
  state: true,
  language: 'en',
  timezone: 'Europe/Berlin',
  sendEmail: false,
  resetCount: 0,
};

export const getUserFixtures = (users: UserCreateDto[]) =>
  getFixturesWithDefaultValues<User, UserCreateDto>({
    fixtures: users,
    defaultValues: userDefaultValues,
  });

export const userFixtures = getUserFixtures(users);

export const userFixtureIds = {
  admin: '66666666-6666-6666-6666-666666666666',
} as const;

export const installUserFixturesTypeOrm = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(RoleOrmEntity);
  const userRepository = dataSource.getRepository(UserOrmEntity);

  if ((await roleRepository.count()) === 0) {
    await installRoleFixturesTypeOrm(dataSource);
  }

  if (await userRepository.count()) {
    return await userRepository.find({ relations: ['roles'] });
  }

  const entities = users.map((user, index) =>
    userRepository.create({
      id:
        userFixtureIds[user.username as keyof typeof userFixtureIds] ??
        (index === 0 ? userFixtureIds.admin : undefined),
      ...user,
      password: hash(user.password),
      roles: user.roles.map((roleId) => ({ id: roleId }) as RoleOrmEntity),
      avatar: user.avatar ? { id: user.avatar } : undefined,
    }),
  );

  return await userRepository.save(entities);
};
