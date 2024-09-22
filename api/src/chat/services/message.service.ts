/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import {
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
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
   * Retrieves a paginated list of messages based on the provided filters
   * and page query, and populates the results with additional data.
   *
   * @param filters - The query filters to apply for message retrieval.
   * @param pageQuery - The page query containing pagination information.
   *
   * @returns A paginated list of populated messages.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<AnyMessage>,
    pageQuery: PageQueryDto<AnyMessage>,
  ) {
    return await this.messageRepository.findPageAndPopulate(filters, pageQuery);
  }

  /**
   * Retrieves a single message by its identifier and populates it with
   * additional data.
   *
   * @param id - The identifier of the message to retrieve.
   *
   * @returns A populated message object.
   */
  async findOneAndPopulate(id: string) {
    return await this.messageRepository.findOneAndPopulate(id);
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
}
