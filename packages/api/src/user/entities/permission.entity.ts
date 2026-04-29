/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createRequire } from 'node:module';

import { permissionSchema, permissionFullSchema } from '@hexabot-ai/types';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { PermissionDto } from '../dto/permission.dto';
import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

import type { ModelOrmEntity } from './model.entity';
import type { RoleOrmEntity } from './role.entity';

const requireEntity = createRequire(__filename);

@Entity({ name: 'permissions' })
@Index(['model', 'action', 'role', 'relation'], { unique: true })
export class PermissionOrmEntity extends BaseOrmEntity<PermissionDto> {
  plainCls = permissionSchema;

  fullCls = permissionFullSchema;

  @ManyToOne(
    () => requireEntity('./model.entity').ModelOrmEntity,
    (model: ModelOrmEntity) => model.permissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'model_id' })
  @AsRelation()
  model!: ModelOrmEntity;

  @RelationId((permission: PermissionOrmEntity) => permission.model)
  private readonly modelId!: string;

  @EnumColumn({ enum: Action })
  action!: Action;

  @ManyToOne(
    () => requireEntity('./role.entity').RoleOrmEntity,
    (role: RoleOrmEntity) => role.permissions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'role_id' })
  @AsRelation()
  role!: RoleOrmEntity;

  @RelationId((permission: PermissionOrmEntity) => permission.role)
  private readonly roleId!: string;

  @Column({ type: 'varchar', default: 'role' })
  relation!: TRelation;
}
