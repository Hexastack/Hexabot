/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Conversation,
  ConversationDtoConfig,
  ConversationFull,
  ConversationTransformerDto,
} from '../dto/conversation.dto';
import { ConversationOrmEntity } from '../entities/conversation.entity';

@Injectable()
export class ConversationRepository extends BaseOrmRepository<
  ConversationOrmEntity,
  ConversationTransformerDto,
  ConversationDtoConfig
> {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    repository: Repository<ConversationOrmEntity>,
  ) {
    super(repository, ['sender', 'current', 'next'], {
      PlainCls: Conversation,
      FullCls: ConversationFull,
    });
  }

  /**
   * Marks a conversation as ended by setting its `active` status to `false`.
   *
   * @param convo The conversation or full conversation object to be ended.
   *
   * @returns A promise resolving to the result of the update operation.
   */
  async end(convo: Conversation | ConversationFull): Promise<Conversation> {
    return await this.updateOne(convo.id, { active: false });
  }
}
