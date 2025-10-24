/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import {
  Message,
  MESSAGE_POPULATE,
  MessageFull,
  MessagePopulate,
} from '../schemas/message.schema';
import { SubscriberStub } from '../schemas/subscriber.schema';
import { AnyMessage } from '../types/message';

@Injectable()
export class MessageRepository extends BaseRepository<
  AnyMessage,
  MessagePopulate,
  MessageFull
> {
  constructor(@InjectModel(Message.name) readonly model: Model<AnyMessage>) {
    super(
      model,
      Message as new () => AnyMessage,
      MESSAGE_POPULATE,
      MessageFull,
    );
  }

  /**
   * Pre-create hook to validate message data before saving.
   * If the message is from a end-user (i.e., has a sender), it is saved
   * as an inbox NLP sample. Throws an error if neither sender nor recipient
   * is provided.
   *
   * @param _doc - The message document to be created.
   */
  async preCreate(_doc: AnyMessage): Promise<void> {
    if (_doc) {
      if (!('sender' in _doc) && !('recipient' in _doc)) {
        throw new Error('Either sender or recipient must be provided!');
      }
    }
  }

  /**
   * Retrieves the message history for a given subscriber, with messages sent or received
   * before the specified date. Results are limited and sorted by creation date.
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param until - Optional date to retrieve messages sent before (default: current date).
   * @param limit - Optional limit on the number of messages to retrieve (default: 30).
   *
   * @returns The message history until the specified date.
   */
  async findHistoryUntilDate<S extends SubscriberStub>(
    subscriber: S,
    until = new Date(),
    limit: number = 30,
  ) {
    return await this.find(
      {
        $or: [{ recipient: subscriber.id }, { sender: subscriber.id }],
        createdAt: { $lt: until },
      },
      { skip: 0, limit, sort: ['createdAt', 'desc'] },
    );
  }

  /**
   * Retrieves the message history for a given subscriber, with messages sent or received
   * after the specified date. Results are limited and sorted by creation date.
   *
   * @param subscriber The subscriber whose message history is being retrieved.
   * @param since Optional date to retrieve messages sent after (default: current date).
   * @param limit Optional limit on the number of messages to retrieve (default: 30).
   *
   * @returns The message history since the specified date.
   */
  async findHistorySinceDate<S extends SubscriberStub>(
    subscriber: S,
    since = new Date(),
    limit: number = 30,
  ) {
    return await this.find(
      {
        $or: [{ recipient: subscriber.id }, { sender: subscriber.id }],
        createdAt: { $gt: since },
      },
      { skip: 0, limit, sort: ['createdAt', 'asc'] },
    );
  }
}
