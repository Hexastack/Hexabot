/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { TFilterQuery } from '@/utils/types/filter.types';

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

  protected override async preDelete(
    entities: RoleOrmEntity[],
    _filter: TFilterQuery<RoleOrmEntity>,
  ): Promise<void> {
    for (const entity of entities) {
      const users = await this.repository
        .createQueryBuilder()
        .relation(RoleOrmEntity, 'users')
        .of(entity)
        .loadMany();

      if (users.length > 0) {
        await this.repository
          .createQueryBuilder()
          .relation(RoleOrmEntity, 'users')
          .of(entity)
          .remove(users);
      }
    }
  }
}
