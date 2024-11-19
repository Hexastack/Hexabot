/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { promises as fsPromises } from 'fs';
import path from 'path';

import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import multer, { diskStorage } from 'multer';
import sanitize from 'sanitize-filename';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import EventWrapper from '@/channel/lib/EventWrapper';
import ChannelHandler from '@/channel/lib/Handler';
import { ChannelName } from '@/channel/types';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { Subscriber, SubscriberFull } from '@/chat/schemas/subscriber.schema';
import { WithUrl } from '@/chat/schemas/types/attachment';
import { Button, ButtonType } from '@/chat/schemas/types/button';
import {
  AnyMessage,
  ContentElement,
  FileType,
  IncomingMessage,
  OutgoingMessage,
  OutgoingMessageFormat,
  PayloadType,
  StdEventType,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingEnvelope,
  StdOutgoingListMessage,
  StdOutgoingMessage,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
} from '@/chat/schemas/types/message';
import { BlockOptions } from '@/chat/schemas/types/options';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { Content } from '@/cms/schemas/content.schema';
import { MenuService } from '@/cms/services/menu.service';
import { config } from '@/config';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { WEB_CHANNEL_NAMESPACE } from './settings';
import { Web } from './types';
import WebEventWrapper from './wrapper';

@Injectable()
export default abstract class BaseWebChannelHandler<
  N extends ChannelName,
> extends ChannelHandler<N> {
  constructor(
    name: N,
    settingService: SettingService,
    channelService: ChannelService,
    logger: LoggerService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly i18n: I18nService,
    protected readonly subscriberService: SubscriberService,
    protected readonly attachmentService: AttachmentService,
    protected readonly messageService: MessageService,
    protected readonly menuService: MenuService,
    protected readonly websocketGateway: WebsocketGateway,
  ) {
    super(name, settingService, channelService, logger);
  }

  /**
   * No init needed for the moment
   *
   * @returns -
   */
  init(): void {
    this.logger.debug('Web Channel Handler : initialization ...');
  }

  /**
   * Verify web websocket connection and return settings
   *
   * @param client - The socket client
   */
  @OnEvent('hook:websocket:connection', { async: true })
  async onWebSocketConnection(client: Socket) {
    try {
      const settings = await this.getSettings();
      const handshake = client.handshake;
      const { channel } = handshake.query;

      if (channel !== this.getName()) {
        return;
      }

      this.logger.debug(
        'Web Channel Handler : WS connected .. sending settings',
      );

      try {
        const menu = await this.menuService.getTree();
        return client.emit('settings', { menu, ...settings });
      } catch (err) {
        this.logger.warn('Web Channel Handler : Unable to retrieve menu ', err);
        return client.emit('settings', settings);
      }
    } catch (err) {
      this.logger.error(
        'Web Channel Handler : Unable to initiate websocket connection',
        err,
      );
      client.disconnect();
    }
  }

  /**
   * Adapt incoming message structure for web channel
   *
   * @param incoming - Incoming message
   * @returns Formatted web message
   */
  private formatIncomingHistoryMessage(
    incoming: IncomingMessage,
  ): Web.IncomingMessageBase {
    // Format incoming message
    if ('type' in incoming.message) {
      if (incoming.message.type === PayloadType.location) {
        const coordinates = incoming.message.coordinates;
        return {
          type: Web.IncomingMessageType.location,
          data: {
            coordinates: {
              lat: coordinates.lat,
              lng: coordinates.lon,
            },
          },
        };
      } else {
        // @TODO : handle multiple files
        const attachment = Array.isArray(incoming.message.attachment)
          ? incoming.message.attachment[0]
          : incoming.message.attachment;
        return {
          type: Web.IncomingMessageType.file,
          data: {
            type: attachment.type,
            url: attachment.payload.url,
          },
        };
      }
    } else {
      return {
        type: Web.IncomingMessageType.text,
        data: incoming.message,
      };
    }
  }

  /**
   * Adapt the outgoing message structure for web channel
   *
   * @param outgoing - The outgoing message
   * @returns Formatted web message
   */
  private formatOutgoingHistoryMessage(
    outgoing: OutgoingMessage,
  ): Web.OutgoingMessageBase {
    // Format outgoing message
    if ('buttons' in outgoing.message) {
      return this._buttonsFormat(outgoing.message);
    } else if ('attachment' in outgoing.message) {
      return this._attachmentFormat(outgoing.message);
    } else if ('quickReplies' in outgoing.message) {
      return this._quickRepliesFormat(outgoing.message);
    } else if ('options' in outgoing.message) {
      if (outgoing.message.options.display === 'carousel') {
        return this._carouselFormat(outgoing.message, {
          content: outgoing.message.options,
        });
      } else {
        return this._listFormat(outgoing.message, {
          content: outgoing.message.options,
        });
      }
    } else {
      return this._textFormat(outgoing.message);
    }
  }

  /**
   * Adapt the message structure for web channel
   *
   * @param messages - The messages to be formatted
   *
   * @returns Formatted message
   */
  protected formatMessages(messages: AnyMessage[]): Web.Message[] {
    return messages.map((anyMessage: AnyMessage) => {
      if ('sender' in anyMessage && anyMessage.sender) {
        return {
          ...this.formatIncomingHistoryMessage(anyMessage as IncomingMessage),
          author: anyMessage.sender,
          read: true, // Temporary fix as read is false in the bd
          mid: anyMessage.mid,
          createdAt: anyMessage.createdAt,
        } as Web.IncomingMessage;
      } else {
        const outgoingMessage = anyMessage as OutgoingMessage;
        return {
          ...this.formatOutgoingHistoryMessage(outgoingMessage),
          author: 'chatbot',
          read: true, // Temporary fix as read is false in the bd
          mid: outgoingMessage.mid,
          handover: !!outgoingMessage.handover,
          createdAt: outgoingMessage.createdAt,
        } as Web.OutgoingMessage;
      }
    });
  }

  /**
   * Fetches the messaging history from the DB.
   *
   * @param until - Date before which to fetch
   * @param n - Number of messages to fetch
   * @returns Promise to an array of message, rejects into error.
   * Promise to fetch the 'n' last message since a giving date the session profile.
   */
  protected async fetchHistory(
    req: Request | SocketRequest,
    until: Date = new Date(),
    n: number = 30,
  ): Promise<Web.Message[]> {
    const profile = req.session?.web?.profile;
    if (profile) {
      const messages = await this.messageService.findHistoryUntilDate(
        profile,
        until,
        n,
      );
      return this.formatMessages(messages.reverse());
    }
    return [];
  }

  /**
   * Poll new messages by a giving start datetime
   *
   * @param since - Date after which to fetch
   * @param n - Number of messages to fetch
   * @returns Promise to an array of message, rejects into error.
   * Promise to fetch the 'n' new messages since a giving date for the session profile.
   */
  private async pollMessages(
    req: Request,
    since: Date = new Date(10e14),
    n: number = 30,
  ): Promise<Web.Message[]> {
    const profile = req.session?.web?.profile;
    if (profile) {
      const messages = await this.messageService.findHistorySinceDate(
        profile,
        since,
        n,
      );
      return this.formatMessages(messages);
    }
    return [];
  }

  /**
   * Verify the origin against whitelisted domains.
   *
   * @param req
   * @param res
   */
  private async validateCors(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ) {
    const settings = await this.getSettings<typeof WEB_CHANNEL_NAMESPACE>();
    // If we have an origin header...
    if (req.headers && req.headers.origin) {
      // Get the allowed origins
      const origins: string[] = settings.allowed_domains.split(',');
      const foundOrigin = origins.some((origin: string) => {
        origin = origin.trim();
        // If we find a whitelisted origin, send the Access-Control-Allow-Origin header
        // to greenlight the request.
        return origin == req.headers.origin || origin == '*';
      });

      if (!foundOrigin) {
        // For HTTP requests, set the Access-Control-Allow-Origin header to '', which the browser will
        // interpret as, 'no way Jose.'
        res.set('Access-Control-Allow-Origin', '');
        this.logger.debug(
          'Web Channel Handler : No origin found ',
          req.headers.origin,
        );
        throw new Error('CORS - Domain not allowed!');
      } else {
        res.set('Access-Control-Allow-Origin', req.headers.origin);
      }
      // Determine whether or not to allow cookies to be passed cross-origin
      res.set('Access-Control-Allow-Credentials', 'true');
      // This header lets a server whitelist headers that browsers are allowed to access
      res.set('Access-Control-Expose-Headers', '');
      // Handle preflight requests
      if (req.method == 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'content-type');
      }
      return;
    }
    this.logger.debug('Web Channel Handler : No origin ', req.headers);
    throw new Error('CORS - No origin provided!');
  }

  /**
   * Makes sure that message request is legitimate.
   *
   * @param req
   * @param res
   */
  private validateSession(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
    next: (profile: Subscriber) => void,
  ) {
    if (!req.session?.web?.profile?.id) {
      this.logger.warn(
        'Web Channel Handler : No session ID to be found!',
        req.session,
      );
      return res
        .status(403)
        .json({ err: 'Web Channel Handler : Unauthorized!' });
    } else if (
      ('isSocket' in req && !!req.isSocket !== req.session.web.isSocket) ||
      !Array.isArray(req.session.web.messageQueue)
    ) {
      this.logger.warn(
        'Web Channel Handler : Mixed channel request or invalid session data!',
        req.session,
      );
      return res
        .status(403)
        .json({ err: 'Web Channel Handler : Unauthorized!' });
    }
    next(req.session?.web?.profile);
  }

  /**
   * Perform all security measures on the request
   *
   * @param req
   * @param res
   */
  protected async checkRequest(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ) {
    try {
      await this.validateCors(req, res);
    } catch (err) {
      this.logger.warn(
        'Web Channel Handler : Attempt to access from an unauthorized origin',
        err,
      );
      throw new Error('Unauthorized, invalid origin !');
    }
  }

  /**
   * Get or create a session profile for the subscriber
   *
   * @param req
   *
   * @returns Subscriber's profile
   */
  protected async getOrCreateSession(
    req: Request | SocketRequest,
  ): Promise<SubscriberFull> {
    const data = req.query;
    // Subscriber has already a session
    const sessionProfile = req.session?.web?.profile;
    if (sessionProfile) {
      const subscriber = await this.subscriberService.findOneAndPopulate(
        sessionProfile.id,
      );
      if (!subscriber || !req.session.web) {
        throw new Error('Subscriber session was not persisted in DB');
      }
      req.session.web.profile = subscriber;
      return subscriber;
    }

    const channelData = this.getChannelData(req);
    const newProfile: SubscriberCreateDto = {
      foreign_id: this.generateId(),
      first_name: data.first_name ? data.first_name.toString() : 'Anon.',
      last_name: data.last_name ? data.last_name.toString() : 'Web User',
      assignedTo: null,
      assignedAt: null,
      lastvisit: new Date(),
      retainedFrom: new Date(),
      channel: {
        ...channelData,
        name: this.getName() as ChannelName,
      },
      language: '',
      locale: '',
      timezone: 0,
      gender: 'male',
      country: '',
      labels: [],
    };
    const subscriber = await this.subscriberService.create(newProfile);
    // Init session
    const profile: SubscriberFull = {
      ...subscriber,
      labels: [],
      assignedTo: null,
      avatar: null,
    };

    req.session.web = {
      profile,
      isSocket: 'isSocket' in req && !!req.isSocket,
      messageQueue: [],
      polling: false,
    };
    return profile;
  }

  /**
   * Return message queue (using by long polling case only)
   *
   * @param req
   * @param res
   */
  private getMessageQueue(req: Request, res: Response) {
    // Polling not authorized when using websockets
    if ('isSocket' in req && req.isSocket) {
      this.logger.warn(
        'Web Channel Handler : Polling not authorized when using websockets',
      );
      return res
        .status(403)
        .json({ err: 'Polling not authorized when using websockets' });
    }
    // Session must be active
    if (!(req.session && req.session.web && req.session.web.profile.id)) {
      this.logger.warn(
        'Web Channel Handler : Must be connected to poll messages',
      );
      return res
        .status(403)
        .json({ err: 'Polling not authorized : Must be connected' });
    }

    // Can only request polling once at a time
    if (req.session && req.session.web && req.session.web.polling) {
      this.logger.warn(
        'Web Channel Handler : Poll rejected ... already requested',
      );
      return res
        .status(403)
        .json({ err: 'Poll rejected ... already requested' });
    }

    req.session.web.polling = true;

    const fetchMessages = async (req: Request, res: Response, retrials = 1) => {
      try {
        const since = new Date(req.query.since.toString());
        const messages = await this.pollMessages(req, since);
        if (messages.length === 0 && retrials <= 5) {
          // No messages found, retry after 5 sec
          setTimeout(async () => {
            await fetchMessages(req, res, retrials * 2);
          }, retrials * 1000);
        } else if (req.session.web) {
          req.session.web.polling = false;
          return res.status(200).json(messages.map((msg) => ['message', msg]));
        } else {
          this.logger.error(
            'Web Channel Handler : Polling failed .. no session data',
          );
          return res.status(500).json({ err: 'No session data' });
        }
      } catch (err) {
        if (req.session.web) {
          req.session.web.polling = false;
        }
        this.logger.error('Web Channel Handler : Polling failed', err);
        return res.status(500).json({ err: 'Polling failed' });
      }
    };
    fetchMessages(req, res);
  }

  /**
   * Allow the subscription to a web's webhook after verification
   *
   * @param req
   * @param res
   */
  protected async subscribe(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ) {
    this.logger.debug(
      'Web Channel Handler : subscribe (isSocket=' +
        ('isSocket' in req && !!req.isSocket) +
        ')',
    );
    try {
      const profile = await this.getOrCreateSession(req);
      // Join socket room when using websocket
      if ('isSocket' in req && !!req.isSocket) {
        try {
          await req.socket.join(profile.foreign_id);
        } catch (err) {
          this.logger.error(
            'Web Channel Handler : Unable to subscribe via websocket',
            err,
          );
        }
      }
      // Fetch message history
      const criteria =
        'since' in req.query
          ? req.query.since // Long polling case
          : req.body?.since || undefined; // Websocket case
      return this.fetchHistory(req, criteria).then((messages) => {
        return res.status(200).json({ profile, messages });
      });
    } catch (err) {
      this.logger.warn('Web Channel Handler : Unable to subscribe ', err);
      return res.status(500).json({ err: 'Unable to subscribe' });
    }
  }

  /**
   * Upload file as attachment if provided
   *
   * @param upload
   * @param filename
   */
  private async storeAttachment(
    upload: Omit<Web.IncomingAttachmentMessageData, 'url' | 'file'>,
    filename: string,
    next: (
      err: Error | null,
      payload: { type: string; url: string } | false,
    ) => void,
  ): Promise<void> {
    try {
      this.logger.debug('Web Channel Handler : Successfully uploaded file');

      const attachment = await this.attachmentService.create({
        name: upload.name || '',
        type: upload.type || 'text/txt',
        size: upload.size || 0,
        location: filename,
        channel: { web: {} },
      });

      this.logger.debug(
        'Web Channel Handler : Successfully stored file as attachment',
      );

      next(null, {
        type: Attachment.getTypeByMime(attachment.type),
        url: Attachment.getAttachmentUrl(attachment.id, attachment.name),
      });
    } catch (err) {
      this.logger.error(
        'Web Channel Handler : Unable to store uploaded file as attachment',
        err,
      );
      next(err, false);
    }
  }

  /**
   * Upload file as attachment if provided
   *
   * @param req
   * @param res
   */
  async handleFilesUpload(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
    next: (
      err: null | Error,
      result: { type: string; url: string } | false,
    ) => void,
  ): Promise<void> {
    const data: Web.IncomingMessage = req.body;
    // Check if any file is provided
    if (!req.session.web) {
      this.logger.debug('Web Channel Handler : No session provided');
      return next(null, false);
    }
    // Check if any file is provided
    if (!data || !data.type || data.type !== 'file') {
      this.logger.debug('Web Channel Handler : No files provided');
      return next(null, false);
    }

    // Parse json form data (in case of content-type multipart/form-data)
    data.data =
      typeof data.data === 'string' ? JSON.parse(data.data) : data.data;

    // Check max size upload
    const upload = data.data;
    if (typeof upload.size === 'undefined') {
      return next(new Error('File upload probably failed.'), false);
    }

    // Store file as attachment
    const dirPath = path.join(config.parameters.uploadDir);
    const sanitizedFilename = sanitize(
      `${req.session.web.profile.id}_${+new Date()}_${upload.name}`,
    );
    const filePath = path.resolve(dirPath, sanitizedFilename);

    if (!filePath.startsWith(dirPath)) {
      return next(new Error('Invalid file path!'), false);
    }

    if ('isSocket' in req && req.isSocket) {
      // @TODO : test this
      try {
        await fsPromises.writeFile(filePath, upload.file);
        this.storeAttachment(upload, sanitizedFilename, next);
      } catch (err) {
        this.logger.error(
          'Web Channel Handler : Unable to write uploaded file',
          err,
        );
        return next(new Error('Unable to upload file!'), false);
      }
    } else {
      const upload = multer({
        storage: diskStorage({
          destination: dirPath, // Set the destination directory for file storage
          filename: (_req, _file, cb) => {
            cb(null, sanitizedFilename); // Set the file name
          },
        }),
      }).single('file'); // 'file' is the field name in the form

      upload(req as Request, res as Response, (err) => {
        if (err) {
          this.logger.error(
            'Web Channel Handler : Unable to write uploaded file',
            err,
          );
          return next(new Error('Unable to upload file!'), false);
        }
        // @TODO : test upload
        // @ts-expect-error @TODO : This needs to be fixed at a later point
        const file = req.file;
        this.storeAttachment(
          {
            name: file.filename,
            type: file.mimetype as FileType, // @Todo : test this
            size: file.size,
          },
          file.path.replace(dirPath, ''),
          next,
        );
      });
    }
  }

  /**
   * Returns the request client IP address
   *
   * @param req
   *
   * @returns IP Address
   */
  protected getIpAddress(req: Request | SocketRequest): string {
    if ('isSocket' in req && req.isSocket) {
      return req.socket.handshake.address;
    } else if (Array.isArray(req.ips) && req.ips.length > 0) {
      // If config.http.trustProxy is enabled, this variable contains the IP addresses
      // in this request's "X-Forwarded-For" header as an array of the IP address strings.
      // Otherwise an empty array is returned.
      return req.ips.join(',');
    } else {
      return req.ip || '0.0.0.0';
    }
  }

  /**
   * Handle channel event (probably a message)
   *
   * @param req
   *
   * @returns The channel's data
   */
  protected getChannelData(req: Request | SocketRequest): Web.ChannelData {
    return {
      isSocket: 'isSocket' in req && !!req.isSocket,
      ipAddress: this.getIpAddress(req),
      agent: req.headers['user-agent'],
    };
  }

  /**
   * Handle channel event (probably a message)
   *
   * @param req
   * @param res
   */
  _handleEvent(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
  ): void {
    const data: Web.IncomingMessage = req.body;
    this.validateSession(req, res, (profile) => {
      this.handleFilesUpload(
        req,
        res,
        // @ts-expect-error @TODO : This needs to be fixed at a later point @TODO
        (err: Error, upload: Web.IncomingMessageData) => {
          if (err) {
            this.logger.warn(
              'Web Channel Handler : Unable to upload file ',
              err,
            );
            return res
              .status(403)
              .json({ err: 'Web Channel Handler : File upload failed!' });
          }
          // Set data in file upload case
          if (upload) {
            data.data = upload;
          }
          const channelData = this.getChannelData(req);
          const event: WebEventWrapper = new WebEventWrapper(
            this,
            data,
            channelData,
          );
          if (event.getEventType() === 'message') {
            // Handler sync message sent by chabbot
            if (data.sync && data.author === 'chatbot') {
              const sentMessage: MessageCreateDto = {
                mid: event.getId(),
                message: event.getMessage() as StdOutgoingMessage,
                recipient: profile.id,
                read: true,
                delivery: true,
              };
              this.eventEmitter.emit('hook:chatbot:sent', sentMessage, event);
              return res.status(200).json(event._adapter.raw);
            } else {
              // Generate unique ID and handle message
              event.set('mid', this.generateId());
            }
          }
          // Force author id from session
          event.set('author', profile.foreign_id);
          event.setSender(profile);

          const type = event.getEventType();
          if (type) {
            this.eventEmitter.emit(`hook:chatbot:${type}`, event);
          } else {
            this.logger.error(
              'Web Channel Handler : Webhook received unknown event ',
              event,
            );
          }
          res.status(200).json(event._adapter.raw);
        },
      );
    });
  }

  /**
   * Process incoming Web Channel data (finding out its type and assigning it to its proper handler)
   *
   * @param req
   * @param res
   */
  async handle(req: Request | SocketRequest, res: Response | SocketResponse) {
    const settings = await this.getSettings();
    // Web Channel messaging can be done through websockets or long-polling
    try {
      await this.checkRequest(req, res);
      if (req.method === 'GET') {
        if (!('isSocket' in req) && req.query._get) {
          switch (req.query._get) {
            case 'settings':
              this.logger.debug(
                'Web Channel Handler : connected .. sending settings',
              );
              try {
                const menu = await this.menuService.getTree();
                return res.status(200).json({
                  menu,
                  server_date: new Date().toISOString(),
                  ...settings,
                });
              } catch (err) {
                this.logger.warn(
                  'Web Channel Handler : Unable to retrieve menu ',
                  err,
                );
                return res.status(500).json({ err: 'Unable to retrieve menu' });
              }
            case 'polling':
              // Handle polling when user is not connected via websocket
              return this.getMessageQueue(req, res as Response);
            default:
              this.logger.error(
                'Web Channel Handler : Webhook received unknown command',
              );
              return res
                .status(500)
                .json({ err: 'Webhook received unknown command' });
          }
        } else if (req.query._disconnect) {
          req.session.web = undefined;
          return res.status(200).json({ _disconnect: true });
        } else {
          // Handle webhook subscribe requests
          return await this.subscribe(req, res);
        }
      } else {
        // Handle incoming messages (through POST)
        return this._handleEvent(req, res);
      }
    } catch (err) {
      this.logger.warn('Web Channel Handler : Request check failed', err);
      return res
        .status(403)
        .json({ err: 'Web Channel Handler : Unauthorized!' });
    }
  }

  /**
   * Returns a unique identifier for the subscriber
   *
   * @returns UUID
   */
  generateId(): string {
    return 'web-' + uuidv4();
  }

  /**
   * Formats a text message that will be sent to the widget
   *
   * @param message - A text to be sent to the end user
   * @param _options - might contain additional settings
   *
   * @returns A ready to be sent text message
   */
  _textFormat(
    message: StdOutgoingTextMessage,
    _options?: BlockOptions,
  ): Web.OutgoingMessageBase {
    return {
      type: Web.OutgoingMessageType.text,
      data: message,
    };
  }

  /**
   * Formats a text + quick replies message that can be sent back
   *
   * @param message - A text + quick replies to be sent to the end user
   * @param _options - might contain additional settings
   *
   * @returns A ready to be sent text message
   */
  _quickRepliesFormat(
    message: StdOutgoingQuickRepliesMessage,
    _options?: BlockOptions,
  ): Web.OutgoingMessageBase {
    return {
      type: Web.OutgoingMessageType.quick_replies,
      data: {
        text: message.text,
        quick_replies: message.quickReplies,
      },
    };
  }

  /**
   * Formats a text + buttons message that can be sent back
   *
   * @param message - A text + buttons to be sent to the end user
   * @param _options - Might contain additional settings
   *
   * @returns A formatted Object understandable by the widget
   */
  _buttonsFormat(
    message: StdOutgoingButtonsMessage,
    _options?: BlockOptions,
  ): Web.OutgoingMessageBase {
    return {
      type: Web.OutgoingMessageType.buttons,
      data: {
        text: message.text,
        buttons: message.buttons,
      },
    };
  }

  /**
   * Formats an attachment + quick replies message that can be sent to the widget
   *
   * @param message - An attachment + quick replies to be sent to the end user
   * @param _options - Might contain additional settings
   *
   * @returns A ready to be sent attachment message
   */
  _attachmentFormat(
    message: StdOutgoingAttachmentMessage<WithUrl<Attachment>>,
    _options?: BlockOptions,
  ): Web.OutgoingMessageBase {
    const payload: Web.OutgoingMessageBase = {
      type: Web.OutgoingMessageType.file,
      data: {
        type: message.attachment.type,
        url: message.attachment.payload.url,
      },
    };
    if (message.quickReplies && message.quickReplies.length > 0) {
      payload.data.quick_replies = message.quickReplies;
    }
    return payload;
  }

  /**
   * Formats a collection of items to be sent to the widget (carousel/list)
   *
   * @param data - A list of data items to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns An array of elements object
   */
  _formatElements(
    data: ContentElement[],
    options: BlockOptions,
  ): Web.MessageElement[] {
    if (!options.content || !options.content.fields) {
      throw new Error('Content options are missing the fields');
    }

    const fields = options.content.fields;
    const buttons: Button[] = options.content.buttons;
    return data.map((item) => {
      const element: Web.MessageElement = {
        title: item[fields.title],
        buttons: item.buttons || [],
      };
      if (fields.subtitle && item[fields.subtitle]) {
        element.subtitle = item[fields.subtitle];
      }
      if (fields.image_url && item[fields.image_url]) {
        const attachmentPayload = item[fields.image_url].payload;
        if (attachmentPayload.url) {
          if (!attachmentPayload.id) {
            // @deprecated
            this.logger.warn(
              'Web Channel Handler: Attachment remote url has been deprecated',
              item,
            );
          }
          element.image_url = attachmentPayload.url;
        }
      }

      buttons.forEach((button: Button, index) => {
        const btn = { ...button };
        if (btn.type === ButtonType.web_url) {
          // Get built-in or an external URL from custom field
          const urlField = fields.url;
          btn.url =
            urlField && item[urlField] ? item[urlField] : Content.getUrl(item);
          if (!btn.url.startsWith('http')) {
            btn.url = 'https://' + btn.url;
          }
          // Set default action the same as the first web_url button
          if (!element.default_action) {
            const { title: _title, ...defaultAction } = btn;
            element.default_action = defaultAction;
          }
        } else {
          if (
            'action_payload' in fields &&
            fields.action_payload &&
            fields.action_payload in item
          ) {
            btn.payload = btn.title + ':' + item[fields.action_payload];
          } else {
            const postback = Content.getPayload(item);
            btn.payload = btn.title + ':' + postback;
          }
        }
        // Set custom title for first button if provided
        if (index === 0 && fields.action_title && item[fields.action_title]) {
          btn.title = item[fields.action_title];
        }
        element.buttons?.push(btn);
      });
      if (Array.isArray(element.buttons) && element.buttons.length === 0) {
        delete element.buttons;
      }
      return element;
    });
  }

  /**
   * Format a list of elements
   *
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns A ready to be sent list template message
   */
  _listFormat(
    message: StdOutgoingListMessage,
    options: BlockOptions,
  ): Web.OutgoingMessageBase {
    const data = message.elements || [];
    const pagination = message.pagination;
    let buttons: Button[] = [],
      elements: Web.MessageElement[] = [];

    // Items count min check
    if (!data.length) {
      this.logger.error(
        'Web Channel Handler : Unsufficient content count (must be >= 0 for list)',
      );
      throw new Error('Unsufficient content count (list >= 0)');
    }

    // Toggle "View More" button (check if there's more items to display)
    if (pagination.total - pagination.skip - pagination.limit > 0) {
      buttons = [
        {
          type: ButtonType.postback,
          title: this.i18n.t('View More'),
          payload: VIEW_MORE_PAYLOAD,
        },
      ];
    }

    // Populate items (elements/cards) with content
    elements = this._formatElements(data, options);
    const topElementStyle = options.content?.top_element_style
      ? {
          top_element_style: options.content?.top_element_style,
        }
      : {};
    return {
      type: Web.OutgoingMessageType.list,
      data: {
        elements,
        buttons,
        ...topElementStyle,
      },
    };
  }

  /**
   * Format a carousel message
   *
   * @param message - Contains elements to be sent to the end user
   * @param options - Might contain additional settings
   *
   * @returns A carousel ready to be sent as a message
   */
  _carouselFormat(
    message: StdOutgoingListMessage,
    options: BlockOptions,
  ): Web.OutgoingMessageBase {
    const data = message.elements || [];
    // Items count min check
    if (data.length === 0) {
      this.logger.error(
        'Web Channel Handler : Unsufficient content count (must be > 0 for carousel)',
      );
      throw new Error('Unsufficient content count (carousel > 0)');
    }

    // Populate items (elements/cards) with content
    const elements = this._formatElements(data, options);
    return {
      type: Web.OutgoingMessageType.carousel,
      data: {
        elements,
      },
    };
  }

  /**
   * Creates an widget compliant data structure for any message envelope
   *
   * @param envelope - The message standard envelope
   * @param options - The block options related to the message
   *
   * @returns A template filled with its payload
   */
  _formatMessage(
    envelope: StdOutgoingEnvelope,
    options: BlockOptions,
  ): Web.OutgoingMessageBase {
    switch (envelope.format) {
      case OutgoingMessageFormat.attachment:
        return this._attachmentFormat(envelope.message, options);
      case OutgoingMessageFormat.buttons:
        return this._buttonsFormat(envelope.message, options);
      case OutgoingMessageFormat.carousel:
        return this._carouselFormat(envelope.message, options);
      case OutgoingMessageFormat.list:
        return this._listFormat(envelope.message, options);
      case OutgoingMessageFormat.quickReplies:
        return this._quickRepliesFormat(envelope.message, options);
      case OutgoingMessageFormat.text:
        return this._textFormat(envelope.message, options);

      default:
        throw new Error('Unknown message format');
    }
  }

  /**
   * Sends a message to the end-user using websocket
   *
   * @param subscriber - End-user toward which message will be sent
   * @param type - The message to be sent (message, typing, ...)
   * @param content - The message payload contain additional settings
   */
  private broadcast(
    subscriber: Subscriber,
    type: StdEventType,
    content: any,
  ): void {
    if (subscriber.channel.isSocket) {
      this.websocketGateway.broadcast(subscriber, type, content);
    } else {
      // Do nothing, messages will be retrieved via polling
    }
  }

  /**
   * Send a Web Channel Message to the end-user
   *
   * @param event - Incoming event/message being responded to
   * @param envelope - The message to be sent {format, message}
   * @param options - Might contain additional settings
   * @param _context - Contextual data
   *
   * @returns The web's response, otherwise an error
   */
  async sendMessage(
    event: EventWrapper<any, any>,
    envelope: StdOutgoingEnvelope,
    options: BlockOptions,
    _context?: any,
  ): Promise<{ mid: string }> {
    const messageBase: Web.OutgoingMessageBase = this._formatMessage(
      envelope,
      options,
    );
    const subscriber = event.getSender();

    const message: Web.OutgoingMessage = {
      ...messageBase,
      mid: this.generateId(),
      author: 'chatbot',
      createdAt: new Date(),
      handover: !!(options && options.assignTo),
    };
    const next = async (): Promise<any> => {
      this.broadcast(subscriber, StdEventType.message, message);
      return { mid: message.mid };
    };

    if (options && options.typing) {
      const autoTimeout =
        message && message.data && 'text' in message.data
          ? message.data.text.length * 10
          : 1000;
      const timeout =
        typeof options.typing === 'number' ? options.typing : autoTimeout;
      try {
        await this.sendTypingIndicator(subscriber, timeout);
        return next();
      } catch (err) {
        this.logger.error(
          'Web Channel Handler : Failed in sending typing indicator ',
          err,
        );
      }
    }

    return next();
  }

  /**
   * Send a typing indicator (waterline) to the end user for a given duration
   *
   * @param recipient - The end-user object
   * @param timeout - Duration of the typing indicator in milliseconds
   */
  async sendTypingIndicator(
    recipient: Subscriber,
    timeout: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.broadcast(recipient, StdEventType.typing, true);
        setTimeout(() => {
          this.broadcast(recipient, StdEventType.typing, false);
          return resolve();
        }, timeout);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Fetch the end-user profile data
   *
   * @param event - The message event received
   *
   * @returns The web's response, otherwise an error
   */
  async getUserData(event: WebEventWrapper): Promise<SubscriberCreateDto> {
    return event.getSender() as SubscriberCreateDto;
  }
}
