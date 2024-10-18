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
import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingService } from '@/setting/services/setting.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import EventWrapper from './EventWrapper';
import { ChannelService } from '../channel.service';

@Injectable()
export default abstract class ChannelHandler {
  protected settings: SettingCreateDto[] = [];

  protected NLP: BaseNlpHelper;

  constructor(
    protected readonly settingService: SettingService,
    private readonly channelService: ChannelService,
    protected readonly nlpService: NlpService,
    protected readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.channelService.setChannel(this.getChannel(), this);
    this.setup();
  }

  async setup() {
    await this.settingService.seedIfNotExist(this.getChannel(), this.settings);
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
   * Returns the channel specific settings
   */
  async getSettings<S>() {
    const settings = await this.settingService.getSettings();
    return settings[this.getSettingGroup()] as S;
  }

  /**
   * Returns the channel's name
   * @returns {String}
   */
  abstract getChannel(): string;

  /**
   * Returns the channel's settings group
   * @returns {String}
   */
  getSettingGroup(): string {
    return this.getChannel().replaceAll('-', '_');
  }

  /**
   * Perform any initialization needed
   * @returns 
   
   */
  abstract init(): void;

  /**
   * @param {module:Controller.req} req
   * @param {module:Controller.res} res
   * Process incoming channel data via POST/GET methods
   */
  abstract handle(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ): any;

  /**
   * Format a text message that will be sent to the channel
   * @param message - A text to be sent to the end user
   * @param options - might contain additional settings
   * @returns {Object} - A text message in the channel specific format
   
   */
  abstract _textFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * @param message - A text + quick replies to be sent to the end user
   * @param options - might contain additional settings
   * @returns {Object} - A quick replies message in the channel specific format
   * Format a text + quick replies message that can be sent to the channel
   */
  abstract _quickRepliesFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * @param message - A text + buttons to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - A buttons message in the format required by the channel
   * From raw buttons, construct a channel understable message containing those buttons
   */
  abstract _buttonsFormat(
    message: StdOutgoingMessage,
    options?: any,
    ...args: any
  ): any;

  /**
   * @param message - An attachment + quick replies to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object} - An attachment message in the format required by the channel
   * Format an attachment + quick replies message that can be sent to the channel
   */
  abstract _attachmentFormat(message: StdOutgoingMessage, options?: any): any;

  /**
   * @param data - A list of data items to be sent to the end user
   * @param options - Might contain additional settings
   * @returns {Object[]} - An array of element objects
   * Format a collection of items to be sent to the channel in carousel/list format
   */
  abstract _formatElements(data: any[], options: any, ...args: any): any[];

  /**
   * Format a list of elements
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
