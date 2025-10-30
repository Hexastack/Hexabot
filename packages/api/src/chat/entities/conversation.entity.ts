/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

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
  readonly senderId!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'json' })
  context: Context = getDefaultConversationContext();

  @ManyToOne(() => BlockOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'current_block_id' })
  @AsRelation()
  current: BlockOrmEntity | null;

  @RelationId((conversation: ConversationOrmEntity) => conversation.current)
  readonly currentBlockId?: string | null;

  @ManyToMany(() => BlockOrmEntity)
  @JoinTable({
    name: 'conversation_next_blocks',
    joinColumn: { name: 'conversation_id' },
    inverseJoinColumn: { name: 'block_id' },
  })
  @AsRelation({ allowArray: true })
  next: BlockOrmEntity[];

  @RelationId((conversation: ConversationOrmEntity) => conversation.next)
  readonly nextBlockIds!: string[];
}
