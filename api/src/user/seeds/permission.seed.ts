/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseSeeder } from '@/utils/generics/base-seeder';

import { PermissionDto } from '../dto/permission.dto';
import { PermissionRepository } from '../repositories/permission.repository';
import {
  Permission,
  PermissionFull,
  PermissionPopulate,
} from '../schemas/permission.schema';

@Injectable()
export class PermissionSeeder extends BaseSeeder<
  Permission,
  PermissionPopulate,
  PermissionFull,
  PermissionDto
> {
  constructor(private readonly permissionRepository: PermissionRepository) {
    super(permissionRepository);
  }
}
