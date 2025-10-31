/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

import { ModelOrmEntity } from './model.entity';
import { RoleOrmEntity } from './role.entity';

@Entity({ name: 'permissions' })
@Index(['model', 'action', 'role', 'relation'], { unique: true })
export class PermissionOrmEntity extends BaseOrmEntity {
  @ManyToOne(() => ModelOrmEntity, (model) => model.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'model_id' })
  @AsRelation()
  model!: ModelOrmEntity;

  @RelationId((permission: PermissionOrmEntity) => permission.model)
  private readonly modelId!: string;

  @Column({ type: 'simple-enum', enum: Action })
  action!: Action;

  @ManyToOne(() => RoleOrmEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  @AsRelation()
  role!: RoleOrmEntity;

  @RelationId((permission: PermissionOrmEntity) => permission.role)
  private readonly roleId!: string;

  @Column({ default: 'role' })
  relation!: TRelation;
}
