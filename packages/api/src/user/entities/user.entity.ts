/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BeforeInsert,
  BeforeUpdate,
  ChildEntity,
  Column,
  Index,
  JoinTable,
  ManyToMany,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { UserProvider } from '../types/user-provider.type';
import { hash } from '../utilities/bcryptjs';

import { RoleOrmEntity } from './role.entity';
import { UserProfileOrmEntity } from './user-profile.entity';

@ChildEntity()
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class UserOrmEntity extends UserProfileOrmEntity {
  @Column()
  username!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @ManyToMany(() => RoleOrmEntity, (role) => role.users, {
    cascade: false,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  @AsRelation({ allowArray: true })
  roles!: RoleOrmEntity[];

  @RelationId((user: UserOrmEntity) => user.roles)
  private readonly roleIds!: string[];

  @Column({ name: 'send_email', default: false })
  sendEmail!: boolean;

  @Column({ default: true })
  state!: boolean;

  @Column({ name: 'reset_count', type: 'integer', default: 0 })
  resetCount!: number;

  @Column({ name: 'reset_token', nullable: true, type: 'text' })
  resetToken?: string | null;

  @JsonColumn({ nullable: true })
  provider?: UserProvider;

  @BeforeInsert()
  ensureProvider(): void {
    if (!this.provider) {
      this.provider = { strategy: 'local' };
    }
  }

  @BeforeInsert()
  ensurePassword(): void {
    if (!this.password) {
      throw new Error('No password provided');
    }

    this.password = this.hashIfNeeded(this.password);
    if (this.resetToken) {
      this.resetToken = this.hashIfNeeded(this.resetToken);
    }
  }

  @BeforeUpdate()
  hashSensitiveFields(): void {
    if (this.password) {
      this.password = this.hashIfNeeded(this.password);
    }

    if (this.resetToken) {
      this.resetToken = this.hashIfNeeded(this.resetToken);
    }
  }

  private hashIfNeeded(value: string): string {
    return value.startsWith('$2') ? value : hash(value);
  }
}
