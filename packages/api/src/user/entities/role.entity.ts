/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Role, RoleDto, RoleFull } from '../dto/role.dto';

import { PermissionOrmEntity } from './permission.entity';
import { UserOrmEntity } from './user.entity';

export type TRole = 'admin' | 'public';

@Entity({ name: 'roles' })
@Index(['name'], { unique: true })
@EntityDto<RoleDto>({ plain: Role, full: RoleFull })
export class RoleOrmEntity extends BaseOrmEntity<RoleDto> {
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
