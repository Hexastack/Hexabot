/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { UserCreateDto } from '@/user/dto/user.dto';
import { User, UserModel } from '@/user/schemas/user.schema';
import { hash } from '@/user/utilities/bcryptjs';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

import { installRoleFixtures } from './role';

export const users: UserCreateDto[] = [
  {
    username: 'admin',
    first_name: 'admin',
    last_name: 'admin',
    email: 'admin@admin.admin',
    password: 'adminadmin',
    roles: ['0', '1'],
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

  const users = await User.create(
    userFixtures.map((userFixture) => ({
      ...userFixture,
      roles: roles
        .map((role) => role.id)
        .filter((_, index) => userFixture.roles.includes(index.toString())),
      password: hash(userFixture.password),
    })),
  );
  return { roles, users };
};
