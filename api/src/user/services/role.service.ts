/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { RoleDto } from '../dto/role.dto';
import { RoleRepository } from '../repositories/role.repository';
import { Role, RoleFull, RolePopulate } from '../schemas/role.schema';

@Injectable()
export class RoleService extends BaseService<
  Role,
  RolePopulate,
  RoleFull,
  RoleDto
> {
  constructor(readonly repository: RoleRepository) {
    super(repository);
  }
}
