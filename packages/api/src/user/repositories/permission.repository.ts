/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Permission,
  PermissionActionDto,
  PermissionFull,
  PermissionTransformerDto,
} from '../dto/permission.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';

@Injectable()
export class PermissionRepository extends BaseOrmRepository<
  PermissionOrmEntity,
  PermissionTransformerDto,
  PermissionActionDto
> {
  constructor(
    @InjectRepository(PermissionOrmEntity)
    repository: Repository<PermissionOrmEntity>,
  ) {
    super(repository, ['model', 'role'], {
      PlainCls: Permission,
      FullCls: PermissionFull,
    });
  }

  protected override async preCreate(
    entity: DeepPartial<PermissionOrmEntity> | PermissionOrmEntity,
  ): Promise<void> {
    this.normalizeRelations(entity);
  }

  protected override async preUpdate(
    _current: PermissionOrmEntity,
    changes: DeepPartial<PermissionOrmEntity>,
  ): Promise<void> {
    this.normalizeRelations(changes);
  }

  private normalizeRelations(
    entity: DeepPartial<PermissionOrmEntity> | PermissionOrmEntity,
  ): void {
    if ('model' in entity && entity.model) {
      const model = entity.model as any;
      if (typeof model === 'string') {
        entity.model = { id: model } as ModelOrmEntity;
        entity.modelId = model;
      } else if (model && typeof model === 'object' && 'id' in model) {
        entity.modelId = model.id;
      }
    }

    if ('role' in entity && entity.role) {
      const role = entity.role as any;
      if (typeof role === 'string') {
        entity.role = { id: role } as RoleOrmEntity;
        entity.roleId = role;
      } else if (role && typeof role === 'object' && 'id' in role) {
        entity.roleId = role.id;
      }
    }

    if (!entity.relation) {
      entity.relation = 'role';
    }
  }
}
