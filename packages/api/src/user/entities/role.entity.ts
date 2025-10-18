/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { PermissionOrmEntity } from './permission.entity';
import { UserOrmEntity } from './user.entity';

export type TRole = 'admin' | 'public';

@Entity({ name: 'roles' })
@Index(['name'], { unique: true })
export class RoleOrmEntity extends BaseOrmEntity {
  @Column()
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => PermissionOrmEntity, (permission) => permission.role, {
    cascade: ['remove'],
  })
  permissions?: PermissionOrmEntity[];

  @ManyToMany(() => UserOrmEntity, (user) => user.roles)
  users?: UserOrmEntity[];
}
