/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { RoleDtoConfig } from '../dto/role.dto';
import { RoleOrmEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends BaseOrmRepository<
  RoleOrmEntity,
  RoleDtoConfig
> {
  constructor(
    @InjectRepository(RoleOrmEntity)
    repository: Repository<RoleOrmEntity>,
  ) {
    super(repository, ['permissions', 'users']);
  }
}
