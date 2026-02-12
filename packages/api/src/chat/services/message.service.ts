/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { Message, MessageDtoConfig } from '../dto/message.dto';
import { Subscriber, SubscriberStub } from '../dto/subscriber.dto';
import { MessageOrmEntity } from '../entities/message.entity';
import { MessageRepository } from '../repositories/message.repository';

@Injectable()
export class MessageService extends BaseOrmService<
  MessageOrmEntity,
  MessageDtoConfig
> {
  constructor(
    readonly repository: MessageRepository,
    private readonly gateway: WebsocketGateway,
  ) {
    super(repository);
  }

  /**
   * Retrieves the message history for a given subscriber up until a specific
   * date, with an optional limit on the number of messages to return.
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param until - The date until which to retrieve messages (defaults to the current date).
   * @param limit - The maximum number of messages to return (defaults to 30).
   *
   * @returns The message history until the specified date.
   */
  async findHistoryUntilDate<S extends SubscriberStub>(
    subscriber: S,
    until = new Date(),
    limit: number = 30,
  ): Promise<Message[]> {
    return await this.repository.findHistoryUntilDate(subscriber, until, limit);
  }

  /**
   * Retrieves the message history for a given subscriber since a specific
   * date, with an optional limit on the number of messages to return.
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param since - The date since which to retrieve messages (defaults to the current date).
   * @param limit - The maximum number of messages to return (defaults to 30).
   *
   * @returns The message history since the specified date.
   */
  async findHistorySinceDate<S extends SubscriberStub>(
    subscriber: S,
    since = new Date(),
    limit: number = 30,
  ): Promise<Message[]> {
    return await this.repository.findHistorySinceDate(subscriber, since, limit);
  }

  /**
   * Retrieves the latest messages for a given subscriber
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param limit - The maximum number of messages to return (defaults to 5).
   *
   * @returns The message history since the specified date.
   */
  async findLastMessages(
    subscriber: Subscriber,
    limit: number = 5,
  ): Promise<Message[]> {
    return await this.repository.findLastMessagesForSubscriber(
      subscriber,
      limit,
    );
  }

  /**
   * Checks if a subscriber has the required permission to access the message including the attachment.
   * @param subscriberId - The ID of the subscriber.
   * @param attachmentId - The ID of the attachment
   * @returns A promise that resolves to a boolean
   */
  async isAttachmentAccessibleBySubscriber(
    subscriberId: string,
    attachmentId: string,
  ) {
    return await this.repository.isAttachmentAccessibleBySubscriber(
      subscriberId,
      attachmentId,
    );
  }
}
