/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
  TableInheritance,
} from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils';

@Entity({ name: 'users' })
@TableInheritance({
  column: { type: 'varchar', name: 'type' },
})
@Index(['first_name'])
@Index(['last_name'])
export class UserProfileOrmEntity extends BaseOrmEntity {
  @Column({ name: 'first_name' })
  first_name: string;

  @Column({ name: 'last_name' })
  last_name: string;

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  @AsRelation()
  avatar: AttachmentOrmEntity | null;

  @RelationId((profile: UserProfileOrmEntity) => profile.avatar)
  private readonly avatarId?: string | null;

  @Column({ length: 2, default: 'en' })
  language: string;

  @Column({ default: 0 })
  timezone: number;

  @OneToMany(() => AttachmentOrmEntity, (attachment) => attachment.createdBy)
  @AsRelation({ allowArray: true })
  createdAttachments?: AttachmentOrmEntity[];
}
