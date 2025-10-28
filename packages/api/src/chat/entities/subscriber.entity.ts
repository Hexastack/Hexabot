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
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { SubscriberChannelData } from '../types/channel';
import { SubscriberContext } from '../types/subscriberContext';

import { LabelOrmEntity } from './label.entity';

@Entity({ name: 'subscribers' })
@Index(['first_name'])
@Index(['last_name'])
@Index(['foreign_id'])
export class SubscriberOrmEntity extends BaseOrmEntity {
  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: 'text', nullable: true })
  locale?: string | null;

  @Column({ type: 'integer', default: 0 })
  timezone?: number;

  @Column({ type: 'text', nullable: true })
  language?: string | null;

  @Column({ type: 'text', nullable: true })
  gender?: string | null;

  @Column({ type: 'text', nullable: true })
  country?: string | null;

  @Column({ type: 'text', nullable: true })
  foreign_id?: string | null;

  @ManyToMany(() => LabelOrmEntity, (label) => label.users, {
    cascade: false,
  })
  @JoinTable({
    name: 'subscriber_labels',
    joinColumn: {
      name: 'subscriber_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_subscriber_labels_subscriber',
    },
    inverseJoinColumn: {
      name: 'label_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'fk_subscriber_labels_label',
    },
  })
  @AsRelation({ allowArray: true })
  labels: LabelOrmEntity[];

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.labels)
  readonly labelIds!: string[];

  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_to_id' })
  @AsRelation()
  assignedTo?: UserOrmEntity | null;

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.assignedTo)
  readonly assignedToId?: string | null;

  @Column({ type: 'datetime', nullable: true })
  assignedAt?: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastvisit?: Date | null = new Date();

  @Column({ type: 'datetime', nullable: true })
  retainedFrom?: Date | null = new Date();

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  @AsRelation()
  avatar?: AttachmentOrmEntity | null;

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.avatar)
  readonly avatarId?: string | null;

  @Column({ type: 'simple-json' })
  channel!: SubscriberChannelData;

  @Column({ type: 'simple-json' })
  context: SubscriberContext = { vars: {} };
}
