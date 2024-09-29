/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
