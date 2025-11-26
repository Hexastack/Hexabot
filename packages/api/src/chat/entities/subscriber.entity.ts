/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ChildEntity,
  Column,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { SubscriberContext } from '../types/subscriberContext';

import { LabelOrmEntity } from './label.entity';

export class SubscriberChannel {
  @Column()
  name: string;

  @JsonColumn({ nullable: true })
  data: any;
}

@ChildEntity()
export class SubscriberOrmEntity extends UserProfileOrmEntity {
  @Column({ type: 'varchar', length: 5, nullable: true })
  locale: string | null;

  @Column({ type: 'varchar', length: 21, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 56, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 64 })
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

  @DatetimeColumn({ nullable: true })
  assignedAt: Date | null;

  @DatetimeColumn({ nullable: true })
  lastvisit: Date | null;

  @DatetimeColumn({ nullable: true })
  retainedFrom: Date | null;

  @Column(() => SubscriberChannel)
  channel!: SubscriberChannel;

  @JsonColumn({ default: JSON.stringify({ vars: {} }) })
  context: SubscriberContext;
}
