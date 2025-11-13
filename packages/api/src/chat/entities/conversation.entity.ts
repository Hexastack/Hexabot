/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { AsRelation } from '@hexabot/core/decorators';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';

import { getDefaultConversationContext } from '../constants/conversation';
import { Context } from '../types/context';

import { BlockOrmEntity } from './block.entity';
import { SubscriberOrmEntity } from './subscriber.entity';

@Entity({ name: 'conversations' })
export class ConversationOrmEntity extends BaseOrmEntity {
  @ManyToOne(() => SubscriberOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  @AsRelation()
  sender!: SubscriberOrmEntity;

  @RelationId((conversation: ConversationOrmEntity) => conversation.sender)
  private readonly senderId!: string;

  @Column({ default: true })
  active!: boolean;

  @JsonColumn()
  context: Context = getDefaultConversationContext();

  @ManyToOne(() => BlockOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'current_block_id' })
  @AsRelation()
  current: BlockOrmEntity | null;

  @RelationId((conversation: ConversationOrmEntity) => conversation.current)
  private readonly currentBlockId?: string | null;

  @ManyToMany(() => BlockOrmEntity)
  @JoinTable({
    name: 'conversation_next_blocks',
    joinColumn: { name: 'conversation_id' },
    inverseJoinColumn: { name: 'block_id' },
  })
  @AsRelation({ allowArray: true })
  next: BlockOrmEntity[];

  @RelationId((conversation: ConversationOrmEntity) => conversation.next)
  private readonly nextBlockIds!: string[];
}
