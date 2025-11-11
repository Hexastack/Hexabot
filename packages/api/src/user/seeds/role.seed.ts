/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { RoleDtoConfig, RoleTransformerDto } from '../dto/role.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleSeeder extends BaseOrmSeeder<
  RoleOrmEntity,
  RoleTransformerDto,
  RoleDtoConfig
> {
  constructor(private readonly roleRepository: RoleRepository) {
    super(roleRepository);
  }
}
