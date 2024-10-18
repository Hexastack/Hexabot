/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import {
  StdOutgoingEnvelope,
  StdOutgoingMessage,
} from '@/chat/schemas/types/message';
import { LoggerService } from '@/logger/logger.service';
import BaseNlpHelper from '@/nlp/lib/BaseNlpHelper';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import { ChannelService } from '../channel.service';
import { ChannelSetting } from '../types';

import EventWrapper from './EventWrapper';

@Injectable()
export default abstract class ChannelHandler<N extends string = string> {
  private readonly name: N;

  private readonly settings: ChannelSetting<N>[];

  protected NLP: BaseNlpHelper;

  constructor(
    name: N,
    settings: ChannelSetting<N>[],
    protected readonly settingService: SettingService,
    private readonly channelService: ChannelService,
    protected readonly nlpService: NlpService,
    protected readonly logger: LoggerService,
  ) {
    this.name = name;
    this.settings = settings;
  }

  onModuleInit() {
    this.channelService.setChannel(
      this.getChannel(),
      this as unknown as ChannelHandler<N>,
    );
    this.setup();
  }

  protected getGroup() {
    return this.getChannel().replaceAll('-', '_');
  }

  async setup() {
    await this.settingService.seedIfNotExist(
      this.getChannel(),
      this.settings.map((s, i) => ({
        ...s,
        weight: i + 1,
      })),
    );
    const nlp = this.nlpService.getNLP();
    this.setNLP(nlp);
    this.init();
  }

  setNLP(nlp: BaseNlpHelper) {
    this.NLP = nlp;
  }

  getNLP() {
    return this.NLP;
  }

  /**
   * Returns the channel's name
   * @returns Channel's name
   */
  getChannel() {
    return this.name;
  }

  /**
   * Returns the channel's settings
   * @returns Channel's settings
   */
  async getSettings() {
    const settings = await this.settingService.getSettings();
    return settings[this.getGroup()];
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
   * Format a collection of items to be sent to the channel in carousel/list format
   *
   * @param data - A list of data items to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object[]} - An array of element objects
   */
  abstract _formatElements(data: any[], options: any, ...args: any): any[];

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
   * @param _attachment - The attachment that needs to be uploaded to the channel
   * @returns {Promise<Attachment>}
   * Uploads an attachment to the channel as some require file to be uploaded so
   *                that they could be used in messaging (dimelo, twitter, ...)
   */
  async uploadAttachment(_attachment: Attachment): Promise<Attachment> {
    return _attachment;
  }

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
