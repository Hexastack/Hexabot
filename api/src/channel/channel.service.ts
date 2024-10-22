/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

import { SubscriberService } from '@/chat/services/subscriber.service';
import { LIVE_CHAT_TEST_CHANNEL_NAME } from '@/extensions/channels/live-chat-tester/settings';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/settings';
import { LoggerService } from '@/logger/logger.service';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import ChannelHandler from './lib/Handler';
import { ChannelName } from './types';

@Injectable()
export class ChannelService {
  private registry: Map<string, ChannelHandler<ChannelName>> = new Map();

  constructor(
    private readonly logger: LoggerService,
    private readonly subscriberService: SubscriberService,
  ) {}

  /**
   * Registers a channel with a specific handler.
   *
   * @param name - The name of the channel to be registered.
   * @param channel - The channel handler associated with the channel name.
   * @typeParam C The channel handler's type that extends `ChannelHandler`.
   */
  public setChannel<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
    channel: C,
  ) {
    this.registry.set(name, channel);
  }

  /**
   * Retrieves all registered channel handlers.
   *
   * @returns An array of all channel handlers currently registered.
   */
  public getAll() {
    return Array.from(this.registry.values());
  }

  /**
   * Finds and returns the channel handler associated with the specified channel name.
   *
   * @param name - The name of the channel to find.
   * @returns The channel handler associated with the specified name, or undefined if the channel is not found.
   */
  public findChannel(name: ChannelName) {
    return this.getAll().find((c) => {
      return c.getName() === name;
    });
  }

  /**
   * Retrieves the appropriate channel handler based on the channel name.
   *
   * @param channelName - The name of the channel (messenger, web, ...).
   * @returns The handler for the specified channel.
   */
  public getChannelHandler<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
  ): C {
    const handler = this.registry.get(name);
    if (!handler) {
      throw new Error(`Channel ${name} not found`);
    }
    return handler as C;
  }

  /**
   * Handles a request for a specific channel.
   *
   * @param channel - The channel for which the request is being handled.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   * @returns A promise that resolves when the handler has processed the request.
   */
  async handle(channel: string, req: Request, res: Response): Promise<void> {
    const handler = this.getChannelHandler(`${channel}-channel`);
    handler.handle(req, res);
  }

  /**
   * Handles a websocket request for the web channel.
   *
   * @param req - The websocket request object.
   * @param res - The websocket response object.
   */
  @SocketGet(`/webhook/${WEB_CHANNEL_NAME}/`)
  @SocketPost(`/webhook/${WEB_CHANNEL_NAME}/`)
  handleWebsocketForWebChannel(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log('Channel notification (Web Socket) : ', req.method);
    const handler = this.getChannelHandler(WEB_CHANNEL_NAME);
    return handler.handle(req, res);
  }

  /**
   * Handles a websocket request for the live chat tester channel.
   * It considers the user as a subscriber.
   *
   * @param req - The websocket request object.
   * @param res - The websocket response object.
   */
  @SocketGet(`/webhook/${LIVE_CHAT_TEST_CHANNEL_NAME}/`)
  @SocketPost(`/webhook/${LIVE_CHAT_TEST_CHANNEL_NAME}/`)
  async handleWebsocketForLiveChatTester(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log(
      'Channel notification (Live Chat Tester Socket) : ',
      req.method,
    );

    if (!req.session?.passport?.user?.id) {
      setTimeout(() => {
        req.socket.client.conn.close();
      }, 300);
      throw new UnauthorizedException(
        'Only authenticated users are allowed to use this channel',
      );
    }

    // Create test subscriber for the current user
    const testSubscriber = await this.subscriberService.findOneOrCreate(
      {
        foreign_id: req.session.passport.user.id,
      },
      {
        id: req.session.passport.user.id,
        foreign_id: req.session.passport.user.id,
        first_name: req.session.passport.user.first_name,
        last_name: req.session.passport.user.last_name,
        locale: '',
        language: '',
        gender: '',
        country: '',
        labels: [],
        channel: {
          name: LIVE_CHAT_TEST_CHANNEL_NAME,
          isSocket: true,
        },
      },
    );

    // Update session (end user is both a user + subscriber)
    req.session.web = {
      profile: testSubscriber,
      isSocket: true,
      messageQueue: [],
      polling: false,
    };

    const handler = this.getChannelHandler(LIVE_CHAT_TEST_CHANNEL_NAME);
    return handler.handle(req, res);
  }
}
