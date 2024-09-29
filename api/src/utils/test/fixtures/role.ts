/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
