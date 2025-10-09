/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
