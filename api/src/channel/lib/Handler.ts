/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import path from 'path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import {
  StdOutgoingEnvelope,
  StdOutgoingMessage,
} from '@/chat/schemas/types/message';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { Extension } from '@/utils/generics/extension';
import { HyphenToUnderscore } from '@/utils/types/extension';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import { ChannelService } from '../channel.service';
import { ChannelName, ChannelSetting } from '../types';

import EventWrapper from './EventWrapper';

export type ChannelNameOf<C> = C extends ChannelHandler<infer N> ? N : never;

@Injectable()
export default abstract class ChannelHandler<
    N extends ChannelName = ChannelName,
  >
  extends Extension
  implements OnModuleInit
{
  private readonly settings: ChannelSetting<N>[];

  constructor(
    name: N,
    protected readonly settingService: SettingService,
    private readonly channelService: ChannelService,
    protected readonly logger: LoggerService,
  ) {
    super(name);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.settings = require(path.join(this.getPath(), 'settings')).default;
  }

  getName() {
    return this.name as N;
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.channelService.setChannel(
      this.getName(),
      this as unknown as ChannelHandler<N>,
    );
    this.setup();
  }

  async setup() {
    await this.settingService.seedIfNotExist(
      this.getName(),
      this.settings.map((s, i) => ({
        ...s,
        weight: i + 1,
      })),
    );
    this.init();
  }

  /**
   * Returns the channel's settings
   * @returns Channel's settings
   */
  async getSettings<S extends string = HyphenToUnderscore<N>>() {
    const settings = await this.settingService.getSettings();
    // @ts-expect-error workaround typing
    return settings[this.getNamespace() as keyof Settings] as Settings[S];
  }

  /**
   * Perform any initialization needed
   */
  abstract init(): void;

  /**
   * Process incoming channel data via POST/GET methods
   *
   * @param {module:Controller.req} req
   * @param {module:Controller.res} res
   */
  abstract handle(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ): any;

  /**
   * Format a text message that will be sent to the channel
   *
   * @param message - A text to be sent to the end user
   * @param options - might contain additional settings
   * @returns {Object} - A text message in the channel specific format
   */
  abstract _textFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * Format a text + quick replies message that can be sent to the channel
   *
   * @param message - A text + quick replies to be sent to the end user
   * @param options - might contain additional settings
   * @returns {Object} - A quick replies message in the channel specific format
   */
  abstract _quickRepliesFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * From raw buttons, construct a channel understable message containing those buttons
   *
   * @param message - A text + buttons to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - A buttons message in the format required by the channel
   */
  abstract _buttonsFormat(
    message: StdOutgoingMessage,
    options?: any,
    ...args: any
  ): any;

  /**
   * Format an attachment + quick replies message that can be sent to the channel
   *
   * @param message - An attachment + quick replies to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - An attachment message in the format required by the channel
   */
  abstract _attachmentFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * Format a list of elements
   *
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - A ready to be sent list template message in the format required by the channel
   */
  abstract _listFormat(
    message: StdOutgoingMessage,
    options: any,
    ...args: any
  ): any;

  /**
   * Format a carousel message
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - A carousel ready to be sent in the format required by the channel
   
   */
  abstract _carouselFormat(
    message: StdOutgoingMessage,
    options: any,
    ...args: any
  ): any;

  /**
   * Send a channel Message to the end user
   * @param event - Incoming event/message being responded to
   * @param envelope - The message to be sent {format, message}
   * @param options - Might contain additional settings
   * @param context - Contextual data
   * @returns {Promise} - The channel's response, otherwise an error
   
   */
  abstract sendMessage(
    event: EventWrapper<any, any>,
    envelope: StdOutgoingEnvelope,
    options: any,
    context: any,
  ): Promise<{ mid: string }>;

  /**
   * Fetch the end user profile data
   * @param event - The message event received
   * @returns {Promise<Subscriber>} - The channel's response, otherwise an error
   
   */
  abstract getUserData(
    event: EventWrapper<any, any>,
  ): Promise<SubscriberCreateDto>;

  /**
   * Custom channel middleware
   * @param req
   * @param res
   * @param next
   */
  async middleware(_req: Request, _res: Response, next: NextFunction) {
    // Do nothing, override in channel
    next();
  }
}
