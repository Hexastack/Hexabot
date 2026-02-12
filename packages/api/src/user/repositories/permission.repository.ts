/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { PermissionDtoConfig } from '../dto/permission.dto';
import { PermissionOrmEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository extends BaseOrmRepository<
  PermissionOrmEntity,
  PermissionDtoConfig
> {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    repository: Repository<PermissionOrmEntity>,
  ) {
    super(repository, ['model', 'role']);
  }
}
