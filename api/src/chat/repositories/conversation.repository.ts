/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { ConversationDto } from '../dto/conversation.dto';
import {
  Conversation,
  CONVERSATION_POPULATE,
  ConversationFull,
  ConversationPopulate,
} from '../schemas/conversation.schema';

@Injectable()
export class ConversationRepository extends BaseRepository<
  Conversation,
  ConversationPopulate,
  ConversationFull,
  ConversationDto
> {
  constructor(
    @InjectModel(Conversation.name) readonly model: Model<Conversation>,
  ) {
    super(model, Conversation, CONVERSATION_POPULATE, ConversationFull);
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
