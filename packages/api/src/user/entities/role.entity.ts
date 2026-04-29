/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createRequire } from 'node:module';

import { roleSchema, roleFullSchema } from '@hexabot-ai/types';
import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';

import { AuditLabel } from '@/audit/decorators/audit-label.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { RoleDto } from '../dto/role.dto';

import type { PermissionOrmEntity } from './permission.entity';
import { UserOrmEntity } from './user.entity';

const requireEntity = createRequire(__filename);

export type TRole = 'admin' | 'public';

@Entity({ name: 'roles' })
@Index(['name'], { unique: true })
export class RoleOrmEntity extends BaseOrmEntity<RoleDto> {
  plainCls = roleSchema;

  fullCls = roleFullSchema;

  @AuditLabel()
  @Column()
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(
    () => requireEntity('./permission.entity').PermissionOrmEntity,
    (permission: PermissionOrmEntity) => permission.role,
    {
      cascade: ['remove'],
    },
  )
  permissions?: PermissionOrmEntity[];

  @ManyToMany(() => UserOrmEntity, (user) => user.roles)
  users?: UserOrmEntity[];
}
