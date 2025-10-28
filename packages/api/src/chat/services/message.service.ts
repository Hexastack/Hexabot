/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { BaseOrmService } from '@/utils/generics/base-orm.service';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import {
  Message,
  MessageDtoConfig,
  MessageTransformerDto,
} from '../dto/message.dto';
import { Subscriber, SubscriberStub } from '../dto/subscriber.dto';
import { MessageOrmEntity } from '../entities/message.entity';
import { MessageRepository } from '../repositories/message.repository';

@Injectable()
export class MessageService extends BaseOrmService<
  MessageOrmEntity,
  MessageTransformerDto,
  MessageDtoConfig,
  MessageRepository
> {
  constructor(
    readonly repository: MessageRepository,
    private readonly gateway: WebsocketGateway,
    private readonly logger: LoggerService,
  ) {
    super(repository);
  }

  /**
   * Subscribes the socket to the message room
   *
   * @param req - The socket request object
   * @param res - The socket response object
   */
  @SocketGet('/message/subscribe/')
  @SocketPost('/message/subscribe/')
  async subscribe(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ): Promise<IOOutgoingSubscribeMessage> {
    try {
      await this.gateway.joinNotificationSockets(req, Room.MESSAGE);

      return res.status(200).json({
        success: true,
        subscribe: Room.MESSAGE,
      });
    } catch (e) {
      this.logger.error('Websocket subscription', e);
      throw new InternalServerErrorException(e);
    }
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
    const lastMessages = await this.find({
      where: [{ senderId: subscriber.id }, { recipientId: subscriber.id }],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return lastMessages.reverse();
  }
}
