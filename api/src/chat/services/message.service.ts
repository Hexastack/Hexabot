/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { Room } from '@/websocket/types';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { MessageRepository } from '../repositories/message.repository';
import { MessageFull, MessagePopulate } from '../schemas/message.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { AnyMessage } from '../schemas/types/message';

@Injectable()
export class MessageService extends BaseService<
  AnyMessage,
  MessagePopulate,
  MessageFull
> {
  private readonly logger: LoggerService;

  private readonly gateway: WebsocketGateway;

  constructor(
    private readonly messageRepository: MessageRepository,
    @Optional() logger?: LoggerService,
    @Optional() gateway?: WebsocketGateway,
  ) {
    super(messageRepository);
    this.logger = logger;
    this.gateway = gateway;
  }

  /**
   * Subscribes the socket to the message room
   *
   * @param req - The socket request object
   * @param res - The socket response object
   */
  @SocketGet('/message/subscribe/')
  @SocketPost('/message/subscribe/')
  subscribe(@SocketReq() req: SocketRequest, @SocketRes() res: SocketResponse) {
    try {
      this.gateway.io.socketsJoin(Room.MESSAGE);
      return res.status(200).json({
        success: true,
      });
    } catch (e) {
      this.logger.error(
        'MessageController subscribe : Websocket subscription',
        e,
      );
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
  async findHistoryUntilDate(
    subscriber: Subscriber,
    until = new Date(),
    limit: number = 30,
  ) {
    return await this.messageRepository.findHistoryUntilDate(
      subscriber,
      until,
      limit,
    );
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
  async findHistorySinceDate(
    subscriber: Subscriber,
    since = new Date(),
    limit: number = 30,
  ) {
    return await this.messageRepository.findHistorySinceDate(
      subscriber,
      since,
      limit,
    );
  }

  /**
   * Retrieves the latest messages for a given subscriber
   *
   * @param subscriber - The subscriber whose message history is being retrieved.
   * @param limit - The maximum number of messages to return (defaults to 5).
   *
   * @returns The message history since the specified date.
   */
  async findLastMessages(subscriber: Subscriber, limit: number = 5) {
    const lastMessages = await this.findPage(
      {
        $or: [{ sender: subscriber.id }, { recipient: subscriber.id }],
      },
      { sort: ['createdAt', 'desc'], skip: 0, limit },
    );

    return lastMessages.reverse();
  }
}
