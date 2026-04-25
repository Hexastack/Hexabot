/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { subscriberSchema, subscriberFullSchema } from '@hexabot-ai/types';
import {
  Check,
  ChildEntity,
  Column,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
  UpdateEvent,
} from 'typeorm';

import type { SourceOrmEntity } from '@/channel/entities/source.entity';
import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import { TZodDto } from '@/utils';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { SubscriberDto } from '../dto/subscriber.dto';

import { LabelOrmEntity } from './label.entity';

export class SubscriberChannel {
  @Column()
  name: string;

  @JsonColumn({ nullable: true })
  data: any;
}

@ChildEntity()
@Index(['source', 'foreignId'])
@Check(
  'CHK_SUBSCRIBER_SOURCE_REQUIRED',
  `"type" != 'SubscriberOrmEntity' OR "source_id" IS NOT NULL`,
)
export class SubscriberOrmEntity<
  Dto extends TZodDto = SubscriberDto,
> extends UserProfileOrmEntity<Dto> {
  plainCls: Dto['transformers']['plain'] =
    subscriberSchema as Dto['transformers']['plain'];

  fullCls: Dto['transformers']['full'] =
    subscriberFullSchema as Dto['transformers']['full'];

  @Column({ type: 'varchar', length: 5, nullable: true })
  locale: string | null;

  @Column({ type: 'varchar', length: 21, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 56, nullable: true })
  country: string | null;

  @Column({ type: 'varchar', length: 64 })
  foreignId: string;

  @ManyToOne('SourceOrmEntity', {
    // STI (`users` table) stores both subscribers and operators.
    // Keep the column nullable at the DB level, and enforce non-null for
    // Subscriber rows via `CHK_SUBSCRIBER_SOURCE_REQUIRED`.
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'source_id' })
  @AsRelation()
  source: SourceOrmEntity;

  @RelationId((subscriber: SubscriberOrmEntity) => subscriber.source)
  private readonly sourceId!: string;

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

  @ManyToOne(() => UserProfileOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigned_to_id' })
  @AsRelation()
  assignedTo: UserProfileOrmEntity<any> | null;

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

  ensureProvider(): void {}

  ensurePassword(): void {}

  hashSensitiveFields(_event: UpdateEvent<UserOrmEntity>) {}

  updateUserAssignedAt(_event: UpdateEvent<SubscriberOrmEntity>) {}
}
