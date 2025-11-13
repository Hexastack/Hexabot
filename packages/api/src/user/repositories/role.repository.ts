/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Role,
  RoleDtoConfig,
  RoleFull,
  RoleTransformerDto,
} from '../dto/role.dto';
import { RoleOrmEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends BaseOrmRepository<
  RoleOrmEntity,
  RoleTransformerDto,
  RoleDtoConfig
> {
  constructor(
    @InjectRepository(RoleOrmEntity)
    repository: Repository<RoleOrmEntity>,
  ) {
    super(repository, ['permissions', 'users'], {
      PlainCls: Role,
      FullCls: RoleFull,
    });
  }
}
