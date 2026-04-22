/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ChildEntity,
  Column,
  Index,
  JoinTable,
  ManyToMany,
  RelationId,
} from 'typeorm';

import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import {
  OnBeforeInsert,
  OnBeforeUpdate,
} from '@/database/decorators/orm-event-hooks.decorator';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { userFullSchema, userSchema, UserDto } from '../dto/user.dto';
import type { UserProvider } from '../types/user-provider.type';
import { hash } from '../utilities/bcryptjs';

import { RoleOrmEntity } from './role.entity';

@ChildEntity()
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
export class UserOrmEntity extends SubscriberOrmEntity<UserDto> {
  plainCls = userSchema;

  fullCls = userFullSchema;

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

  @OnBeforeInsert()
  ensureProvider(): void {
    if (!this.provider) {
      this.provider = { strategy: 'local' };
    }
  }

  @OnBeforeInsert()
  ensurePassword(): void {
    if (!this.password) {
      throw new Error('No password provided');
    }

    this.password = this.hashIfNeeded(this.password);
    if (this.resetToken) {
      this.resetToken = this.hashIfNeeded(this.resetToken);
    }
  }

  @OnBeforeUpdate()
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
