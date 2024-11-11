/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { compareSync } from 'bcryptjs';
import { Request, Response } from 'express';
import Joi from 'joi';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { ChannelName } from '@/channel/types';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { Thread } from '@/chat/schemas/thread.schema';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { ThreadService } from '@/chat/services/thread.service';
import { MenuService } from '@/cms/services/menu.service';
import BaseWebChannelHandler from '@/extensions/channels/web/base-web-channel';
import { Web } from '@/extensions/channels/web/types';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { hash } from '@/user/utilities/bcryptjs';
import { truncate } from '@/utils/helpers/misc';
import {
  SocketGet,
  SocketPost,
} from '@/websocket/decorators/socket-method.decorator';
import { SocketReq } from '@/websocket/decorators/socket-req.decorator';
import { SocketRes } from '@/websocket/decorators/socket-res.decorator';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { CHATUI_CHANNEL_NAME } from './settings';
import { ChatUiWeb } from './types';

// Joi schema for validation
const signUpSchema = Joi.object({
  type: Joi.string().equal('sign_up'),
  data: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
  }),
});

const signInSchema = Joi.object({
  type: Joi.string().equal('sign_in'),
  data: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
});

@Injectable()
export default class ChatUiChannelHandler extends BaseWebChannelHandler<
  typeof CHATUI_CHANNEL_NAME
> {
  constructor(
    settingService: SettingService,
    channelService: ChannelService,
    logger: LoggerService,
    eventEmitter: EventEmitter2,
    i18n: I18nService,
    subscriberService: SubscriberService,
    attachmentService: AttachmentService,
    messageService: MessageService,
    menuService: MenuService,
    websocketGateway: WebsocketGateway,
    private readonly threadService: ThreadService,
  ) {
    super(
      CHATUI_CHANNEL_NAME,
      settingService,
      channelService,
      logger,
      eventEmitter,
      i18n,
      subscriberService,
      attachmentService,
      messageService,
      menuService,
      websocketGateway,
    );
  }

  getPath(): string {
    return __dirname;
  }

  /**
   * Fetches all the messages of a given thread.
   *
   * @param req - Socket request
   * @returns Promise to an array of messages, rejects into error.
   */
  private async fetchThreadMessages(thread: Thread): Promise<Web.Message[]> {
    const messages = await this.messageService.findByThread(thread);
    return this.formatMessages(messages);
  }

  private async signUp(req: SocketRequest, res: SocketResponse) {
    const payload = req.body as ChatUiWeb.SignUpRequest;
    // Validate the request body
    const { error } = signUpSchema.validate(payload, { abortEarly: false });
    if (error) {
      return res
        .status(400)
        .json({ errors: error.details.map((detail) => detail.message) });
    }

    try {
      const { email, password } = payload.data;
      // Check if user already exists
      const existingUser = await this.subscriberService.findOne({
        ['channel.email' as string]: email,
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }

      // Create new user
      const channelData = this.getChannelData(req);
      const newProfile: SubscriberCreateDto = {
        foreign_id: this.generateId(),
        first_name: 'Anon.',
        last_name: 'Chat UI User',
        assignedTo: null,
        assignedAt: null,
        lastvisit: new Date(),
        retainedFrom: new Date(),
        channel: {
          ...channelData,
          name: this.getName() as ChannelName,
          email,
          passwordHash: password ? hash(password) : undefined,
        },
        language: '',
        locale: '',
        timezone: 0,
        gender: 'male',
        country: '',
        labels: [],
      };
      await this.subscriberService.create(newProfile);

      res.status(201).json({ message: 'Registration was successful' });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed' });
    }
  }

  private async signIn(req: SocketRequest, res: SocketResponse) {
    const payload = req.body as ChatUiWeb.SignInRequest;
    // Validate the request body
    const { error } = signInSchema.validate(payload, { abortEarly: false });
    if (error) {
      return res
        .status(400)
        .json({ errors: error.details.map((detail) => detail.message) });
    }
    const { email, password } = payload.data;
    try {
      // Check if user already exists
      const profile = await this.subscriberService.findOne(
        {
          ['channel.email' as string]: email,
        },
        { excludePrefixes: ['_'] },
      );

      if (!profile) {
        return res
          .status(400)
          .json({ message: 'Wrong credentials, try again' });
      }

      if (!compareSync(password, profile.channel.passwordHash)) {
        return res
          .status(400)
          .json({ message: 'Wrong credentials, try again' });
      }

      // Create session
      req.session.web = {
        profile,
        isSocket: 'isSocket' in req && !!req.isSocket,
        messageQueue: [],
        polling: false,
      };

      this.websocketGateway.saveSession(req.socket);

      // Join socket room when using websocket
      await req.socket.join(profile.foreign_id);

      // Fetch last thread and messages
      const thread = await this.threadService.findLast(profile);

      const messages = thread ? await this.fetchThreadMessages(thread) : [];

      return res.status(200).json({ profile, messages, thread });
    } catch (error) {
      return res.status(500).json({ message: 'Registration failed' });
    }
  }

  private async newThread(req: SocketRequest, res: SocketResponse) {
    try {
      const payload = req.body as Web.IncomingTextMessage;
      const subscriber = req.session.web.profile.id;
      return await this.threadService.create({
        title: truncate(payload.data.text),
        subscriber,
      });
    } catch (error) {
      res.status(500).json({ message: 'Unable to start a new thread' });
    }
  }

  /**
   * Process incoming Web Channel data (finding out its type and assigning it to its proper handler)
   *
   * @param req
   * @param res
   */
  async handle(req: Request | SocketRequest, res: Response | SocketResponse) {
    // Only handle websocket
    if (!(req instanceof SocketRequest) || !(res instanceof SocketResponse)) {
      return res.status(500).json({ err: 'Unexpected request!' });
    }

    // ChatUI Channel messaging can be done through websocket
    try {
      await this.checkRequest(req, res);

      const profile = req.session?.web?.profile;

      if (req.method === 'POST') {
        const payload = req.body as ChatUiWeb.Event;
        if (!profile) {
          if (payload.type === ChatUiWeb.RequestType.sign_up) {
            return this.signUp(req, res);
          } else if (payload.type === ChatUiWeb.RequestType.sign_in) {
            return this.signIn(req, res);
          }
        } else {
          if (
            'data' in payload &&
            // @ts-expect-error to be fixed
            payload.type === Web.OutgoingMessageType.text &&
            // @ts-expect-error to be fixed
            !payload.thread
          ) {
            const thread = await this.newThread(req, res);
            // @ts-expect-error to be fixed
            payload.thread = thread.id;
          }
        }
      }

      if (profile) {
        super._handleEvent(req, res);
      } else {
        return res
          .status(401)
          .json({ message: 'Unauthorized! Must be signed-in.' });
      }
    } catch (err) {
      this.logger.warn(
        'ChatUI Channel Handler : Something went wrong ...',
        err,
      );
      return res.status(403).json({ err: 'Something went wrong ...' });
    }
  }

  /**
   * Handles a websocket request for the web channel.
   *
   * @param req - The websocket request object.
   * @param res - The websocket response object.
   */
  @SocketGet(`/webhook/${CHATUI_CHANNEL_NAME}/`)
  @SocketPost(`/webhook/${CHATUI_CHANNEL_NAME}/`)
  handleWebsocketForWebChannel(
    @SocketReq() req: SocketRequest,
    @SocketRes() res: SocketResponse,
  ) {
    this.logger.log('Channel notification (Web Socket) : ', req.method);
    return this.handle(req, res);
  }
}
