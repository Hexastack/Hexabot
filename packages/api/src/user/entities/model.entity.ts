/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, OneToMany } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { TRelation } from '../types/index.type';

import { PermissionOrmEntity } from './permission.entity';

@Entity({ name: 'models' })
@Index(['name'], { unique: true })
@Index(['identity'], { unique: true })
export class ModelOrmEntity extends BaseOrmEntity {
  @Column()
  name!: string;

  @Column()
  identity!: string;

  @JsonColumn({ default: '{}' })
  attributes: Record<string, unknown>;

  @Column({ nullable: true })
  relation?: TRelation;

  @OneToMany(() => PermissionOrmEntity, (permission) => permission.model, {
    cascade: ['remove'],
  })
  permissions?: PermissionOrmEntity[];
}
