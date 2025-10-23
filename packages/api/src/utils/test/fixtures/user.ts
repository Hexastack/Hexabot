/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

import { UserCreateDto } from '@/user/dto/user.dto';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { User, UserModel } from '@/user/schemas/user.schema';
import { hash } from '@/user/utilities/bcryptjs';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

import {
  installRoleFixtures,
  installRoleFixturesTypeOrm,
  roleFixtureIds,
  roleOrmFixtures,
} from './role';

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
  getFixturesWithDefaultValues<User>({
    fixtures: users,
    defaultValues: userDefaultValues,
  });

export const userFixtures = getUserFixtures(users);

export const installUserFixtures = async () => {
  const roles = await installRoleFixtures();
  const User = mongoose.model(UserModel.name, UserModel.schema);

  const roleIdsByIndex = new Map<number, string>();
  roles.forEach((role, index) => roleIdsByIndex.set(index, role.id.toString()));

  const roleIdsByFixtureId = new Map<string, string>();
  roleOrmFixtures.forEach((fixture, index) => {
    const role = roles[index];
    if (role) {
      roleIdsByFixtureId.set(fixture.id, role.id.toString());
    }
  });

  const resolveRoleId = (reference: string, index: number) => {
    if (roleIdsByFixtureId.has(reference)) {
      return roleIdsByFixtureId.get(reference);
    }

    if (/^\d+$/.test(reference)) {
      const fromIndex = roleIdsByIndex.get(Number(reference));
      if (fromIndex) {
        return fromIndex;
      }
    }

    const byName = roles.find(
      (role) => role.name === reference || role.id.toString() === reference,
    );

    if (byName) {
      return byName.id.toString();
    }

    const fallback = roleIdsByIndex.get(index);
    return fallback ?? reference;
  };

  const users = await User.create(
    userFixtures.map((userFixture) => ({
      ...userFixture,
      roles: userFixture.roles
        .map((roleId, index) => resolveRoleId(roleId, index))
        .filter((roleId): roleId is string => Boolean(roleId)),
      password: hash(userFixture.password),
    })),
  );
  return { roles, users };
};

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
