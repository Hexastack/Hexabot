/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { AsRelation } from '@hexabot/core/decorators';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { UserOrmEntity } from '@/user/entities/user.entity';

import { StdIncomingMessage, StdOutgoingMessage } from '../types/message';

import { SubscriberOrmEntity } from './subscriber.entity';

@Check(
  'CHK_MESSAGES_SENDER_OR_RECIPIENT',
  '"sender_id" IS NOT NULL OR "recipient_id" IS NOT NULL',
)
@Entity({ name: 'messages' })
export class MessageOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar', length: 255, nullable: true })
  mid?: string | null;

  @ManyToOne(() => SubscriberOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sender_id' })
  @AsRelation()
  sender?: SubscriberOrmEntity | null;

  @RelationId((message: MessageOrmEntity) => message.sender)
  private readonly senderId?: string | null;

  @ManyToOne(() => SubscriberOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'recipient_id' })
  @AsRelation()
  recipient?: SubscriberOrmEntity | null;

  @RelationId((message: MessageOrmEntity) => message.recipient)
  private readonly recipientId?: string | null;

  @ManyToOne(() => UserOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sent_by_id' })
  @AsRelation()
  sentBy?: UserOrmEntity | null;

  @RelationId((message: MessageOrmEntity) => message.sentBy)
  private readonly sentById?: string | null;

  @JsonColumn()
  message!: StdOutgoingMessage | StdIncomingMessage;

  @Column({ default: false })
  read!: boolean;

  @Column({ default: false })
  delivery!: boolean;

  @Column({ default: false })
  handover!: boolean;
}
