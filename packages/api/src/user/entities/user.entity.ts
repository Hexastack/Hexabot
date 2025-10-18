/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BeforeInsert,
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

import { UserProvider } from '../types/user-provider.type';

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

  @Column({ name: 'avatar_id', nullable: true })
  avatar?: string | null;

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  avatarAttachment?: AttachmentOrmEntity | null;

  @ManyToMany(() => RoleOrmEntity, (role) => role.users, {
    cascade: false,
  })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles!: RoleOrmEntity[];

  @RelationId((user: UserOrmEntity) => user.roles)
  roleIds!: string[];

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

  @Column({ type: 'simple-json', nullable: true })
  provider?: UserProvider;

  @BeforeInsert()
  ensureProvider(): void {
    if (!this.provider) {
      this.provider = { strategy: 'local' };
    }
  }
}
