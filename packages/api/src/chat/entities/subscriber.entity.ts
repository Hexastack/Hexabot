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
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { SubscriberContext } from '../types/subscriberContext';

import { LabelOrmEntity } from './label.entity';

export class SubscriberChannel {
  @Column()
  name: string;

  @JsonColumn()
  data: any;
}

@Entity({ name: 'subscribers' })
@Index(['first_name'])
@Index(['last_name'])
@Index(['foreign_id'])
export class SubscriberOrmEntity extends BaseOrmEntity {
  @Column()
  first_name!: string;

  @Column()
  last_name!: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  locale: string | null;

  @Column({ type: 'integer', default: 0 })
  timezone: number;

  @Column({ type: 'varchar', length: 5, nullable: true })
  language: string | null;

  @Column({ type: 'varchar', length: 21, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 56, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 36 })
  foreign_id: string;

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
  private readonly labelIds!: string[];

  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_to_id' })
  @AsRelation()
  assignedTo: UserOrmEntity | null;

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.assignedTo)
  private readonly assignedToId: string | null;

  @Column({ type: 'datetime', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  lastvisit: Date | null;

  @Column({ type: 'datetime', nullable: true })
  retainedFrom: Date | null;

  @ManyToOne(() => AttachmentOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'avatar_id' })
  @AsRelation()
  avatar?: AttachmentOrmEntity | null;

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.avatar)
  private readonly avatarId?: string | null;

  @Column(() => SubscriberChannel)
  channel!: SubscriberChannel;

  @JsonColumn()
  context: SubscriberContext = { vars: {} };
}
