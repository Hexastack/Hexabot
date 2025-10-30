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
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { UserProvider } from '../types/user-provider.type';
import { hash } from '../utilities/bcryptjs';

import { RoleOrmEntity } from './role.entity';

@Entity({ name: 'users' })
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class UserOrmEntity extends BaseOrmEntity {
  @Column()
  username!: string;

  @Column({ name: 'first_name' })
  first_name!: string;

  @Column({ name: 'last_name' })
  last_name!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  @AsRelation()
  avatar?: AttachmentOrmEntity | null;

  @RelationId((user: UserOrmEntity) => user.avatar)
  readonly avatarId?: string | null;

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
  readonly roleIds!: string[];

  @Column({ name: 'send_email', default: false })
  sendEmail!: boolean;

  @Column({ default: true })
  state!: boolean;

  @Column({ length: 2, default: 'en' })
  language!: string;

  @Column({ default: 'Europe/Berlin' })
  timezone!: string;

  @Column({ name: 'reset_count', type: 'integer', default: 0 })
  resetCount!: number;

  @Column({ name: 'reset_token', nullable: true, type: 'text' })
  resetToken?: string | null;

  @Column({ type: 'jsonb', nullable: true })
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
