/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Action } from '../types/action.type';
import { TRelation } from '../types/index.type';

import { ModelOrmEntity } from './model.entity';
import { RoleOrmEntity } from './role.entity';

@Entity({ name: 'permissions' })
@Index(['modelId', 'action', 'roleId', 'relation'], { unique: true })
export class PermissionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'model_id' })
  modelId!: string;

  @ManyToOne(() => ModelOrmEntity, (model) => model.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'model_id' })
  model!: ModelOrmEntity;

  @Column({ type: 'varchar' })
  action!: Action;

  @ManyToOne(() => RoleOrmEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role!: RoleOrmEntity;

  @Column({ name: 'role_id' })
  roleId!: string;

  @Column({ default: 'role' })
  relation!: TRelation;
}
