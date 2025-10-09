/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { PermissionCreateDto } from '@/user/dto/permission.dto';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { Action } from '@/user/types/action.type';

import { installModelFixtures } from './model';
import { installUserFixtures } from './user';

export const permissionFixtures: PermissionCreateDto[] = [
  {
    model: '0',
    action: Action.CREATE,
    role: '0',
    relation: 'role',
  },
  {
    model: '0',
    action: Action.DELETE,
    role: '0',
    relation: 'role',
  },
  {
    model: '0',
    action: Action.READ,
    role: '1',
    relation: 'role',
  },
  {
    model: '0',
    action: Action.UPDATE,
    role: '0',
    relation: 'role',
  },
];

export const installPermissionFixtures = async () => {
  const { users, roles } = await installUserFixtures();
  const models = await installModelFixtures();

  const Permission = mongoose.model(
    PermissionModel.name,
    PermissionModel.schema,
  );

  const permissions = await Permission.insertMany(
    permissionFixtures.map((permissionFixture) => ({
      ...permissionFixture,
      model: models[parseInt(permissionFixture.model)].id,
      role: roles[parseInt(permissionFixture.role)].id,
    })),
  );

  return { roles, users, permissions };
};
