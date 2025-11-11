/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  RelationId,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { hash } from '../utilities/hash';

import { RoleOrmEntity } from './role.entity';

@Entity({ name: 'invitations' })
export class InvitationOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  token!: string;

  @ManyToMany(() => RoleOrmEntity)
  @JoinTable({
    name: 'invitation_roles',
    joinColumn: { name: 'invitation_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  @AsRelation({ allowArray: true })
  roles!: RoleOrmEntity[];

  @RelationId((invitation: InvitationOrmEntity) => invitation.roles)
  private readonly roleIds!: string[];

  @BeforeInsert()
  @BeforeUpdate()
  private hashToken(): void {
    if (!this.token) {
      return;
    }

    if (InvitationOrmEntity.isHashed(this.token)) {
      return;
    }

    this.token = hash(this.token);
  }

  private static isHashed(value: string): boolean {
    return /^[A-Za-z0-9_-]{43}$/.test(value);
  }
}
