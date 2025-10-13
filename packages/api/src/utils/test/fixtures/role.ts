/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { RoleCreateDto } from '@/user/dto/role.dto';
import { RoleModel } from '@/user/schemas/role.schema';

export const roleFixtures: RoleCreateDto[] = [
  {
    name: 'admin',
    active: true,
  },
  {
    name: 'manager',
    active: true,
  },
  {
    name: 'public',
    active: true,
  },
];

export const installRoleFixtures = async () => {
  const Role = mongoose.model(RoleModel.name, RoleModel.schema);
  return await Role.insertMany(roleFixtures);
};
