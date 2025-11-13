/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { RoleDtoConfig, RoleTransformerDto } from '../dto/role.dto';
import { RoleOrmEntity } from '../entities/role.entity';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService extends BaseOrmService<
  RoleOrmEntity,
  RoleTransformerDto,
  RoleDtoConfig
> {
  constructor(readonly repository: RoleRepository) {
    super(repository);
  }
}
