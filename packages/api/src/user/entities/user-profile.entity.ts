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
import { EnumColumn } from '@/database';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation, TDto } from '@/utils';

import { UserProfileDto, userProfileStubSchema } from '../dto/user-profile.dto';

export enum EUserProfileType {
  SubscriberOrmEntity = 'SubscriberOrmEntity',
  UserOrmEntity = 'UserOrmEntity',
}

@Entity({ name: 'users' })
@TableInheritance({
  column: { type: 'varchar', name: 'type' },
})
@Index(['firstName'])
@Index(['lastName'])
export class UserProfileOrmEntity<
  Dto extends TDto = UserProfileDto,
> extends BaseOrmEntity<Dto> {
  plainCls: Dto['transformers']['plain'] =
    userProfileStubSchema as Dto['transformers']['plain'];

  fullCls: Dto['transformers']['full'] =
    userProfileStubSchema as Dto['transformers']['full'];

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  @AsRelation()
  avatar: AttachmentOrmEntity | null;

  @RelationId((profile: UserProfileOrmEntity<UserProfileDto>) => profile.avatar)
  private readonly avatarId?: string | null;

  @Column({ length: 2, default: 'en' })
  language: string;

  @Column({ default: 0 })
  timezone: number;

  @OneToMany(() => AttachmentOrmEntity, (attachment) => attachment.createdBy)
  @AsRelation({ allowArray: true })
  createdAttachments?: AttachmentOrmEntity[];

  @EnumColumn({ enum: EUserProfileType })
  type: EUserProfileType;
}
