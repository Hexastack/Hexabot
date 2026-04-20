/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@/attachment/types';
import ChannelHandler from '@/channel/lib/Handler';
import { MessageInboundEvent } from '@/channel/lib/inbound-events';
import {
  inferOutgoingMessageEnvelope,
  UnsupportedOutgoingFormatError,
} from '@/channel/lib/outbound';
import { ChannelAttachmentService } from '@/channel/services/channel-attachment.service';
import { ChannelName } from '@/channel/types';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { Subscriber, SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { Thread } from '@/chat/dto/thread.dto';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { ThreadService } from '@/chat/services/thread.service';
import { PayloadType } from '@/chat/types/button';
import {
  AnyMessage,
  IncomingMessage,
  OutgoingMessage,
  OutgoingMessageFormat,
  StdEventType,
  StdOutgoingEnvelope,
  StdOutgoingMessage,
} from '@/chat/types/message';
import { ActionOptions } from '@/chat/types/options';
import { MenuService } from '@/cms/services/menu.service';
import { config } from '@/config';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import {
  AttachmentMessageInboundEvent,
  BaseWebInboundEvent,
  createWebInboundEventDecoder,
  WebInboundEventDecoder,
  WebMessageInboundEvent,
} from './inbound';
import {
  createWebOutboundMessageEncoder,
  WebOutboundMessageEncoder,
} from './outbound';
import { Web } from './types';
import { WEB_CHANNEL_NAME } from './web-channel.settings';

@Injectable()
export default abstract class BaseWebChannelHandler<N extends ChannelName>
  extends ChannelHandler<N>
  implements OnModuleInit
{
  @Inject(SubscriberService)
  protected readonly subscriberService: SubscriberService;

  @Inject(MessageService)
  protected readonly messageService: MessageService;

  @Inject(MenuService)
  protected readonly menuService: MenuService;

  @Inject(WebsocketGateway)
  protected readonly websocketGateway: WebsocketGateway;

  @Inject(ThreadService)
  protected readonly threadService: ThreadService;

  @Inject(ChannelAttachmentService)
  protected readonly channelAttachmentService: ChannelAttachmentService;

  private outboundMessageEncoder!: WebOutboundMessageEncoder;

  private inboundEventDecoder!: WebInboundEventDecoder<N>;

  constructor(name: N) {
    super(name);
  }

  async onModuleInit() {
    await super.onModuleInit();
    const OutboundMessageEncoderProvider = createWebOutboundMessageEncoder(
      this.getName(),
    );
    const InboundEventDecoderProvider = createWebInboundEventDecoder(
      this.getName(),
    );
    [this.outboundMessageEncoder, this.inboundEventDecoder] = await Promise.all(
      [
        this.createModuleRef(OutboundMessageEncoderProvider),
        this.createModuleRef(InboundEventDecoderProvider) as Promise<
          WebInboundEventDecoder<N>
        >,
      ],
    );
    this.logger.debug('initialization ...');
  }

  /**
   * Verify web websocket connection and return settings
   *
   * @param client - The socket client
   */
  @OnEvent('hook:websocket:connection', { async: true })
  async onWebSocketConnection(client: Socket) {
    try {
      const handshake = client.handshake;
      const { channel } = handshake.query;
      const profile = client.request.session.web?.profile;

      if (channel !== this.getName()) {
        return;
      }

      let messages: Web.Message[] | undefined;
      let threadId: string | undefined;

      if (profile?.foreignId) {
        await client.join(profile.foreignId);
        const thread = await this.threadService.resolveThread({
          subscriberId: profile.id,
          explicitThreadId: client.request.session.web?.threadId,
        });
        threadId = thread?.id;
        const currentWebSession = client.request.session.web;
        client.request.session.web = {
          profile: currentWebSession?.profile,
          threadId,
        };
        if (thread) {
          const messagesHistory =
            await this.messageService.findHistoryUntilDate(thread);
          messages = await this.formatMessages(
            messagesHistory.reverse() as AnyMessage[],
          );
        } else {
          messages = [];
        }
      }

      this.logger.debug('WS connected .. sending settings');
      const settings = await this.getSettings();

      try {
        const menu = await this.menuService.getTree();

        client.emit('settings', {
          menu,
          profile,
          thread_id: threadId ?? null,
          messages,
          ...settings,
        });
      } catch (err) {
        this.logger.warn('Unable to retrieve menu ', err);
        client.emit('settings', {
          profile,
          thread_id: threadId ?? null,
          messages,
          ...settings,
        });
      }
    } catch (err) {
      this.logger.error('Unable to initiate websocket connection', err);
      client.disconnect();
    }
  }

  @OnEvent('hook:websocket:error')
  broadcastError(socket: Socket, error: HttpException): void {
    const response = (
      error instanceof HttpException
        ? error.getResponse()
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
          }
    ) as SocketResponse;
    const subscriber = socket.request.session.web?.profile;

    if (socket.handshake.query.channel !== this.getName() || !subscriber) {
      return;
    }

    this.broadcast(subscriber, StdEventType.error, response, [socket.id]);
  }

  /**
   * Adapt incoming message structure for web channel
   *
   * @param incoming - Incoming message
   * @returns Formatted web message
   */
  private async formatIncomingHistoryMessage(
    incoming: IncomingMessage,
  ): Promise<Web.InboundMessageBase> {
    // Format incoming message
    if ('type' in incoming.message) {
      if (incoming.message.type === PayloadType.location) {
        const coordinates = incoming.message.coordinates;

        return {
          type: Web.InboundMessageType.location,
          data: {
            coordinates: {
              lat: coordinates.lat,
              lng: coordinates.lon,
            },
          },
        };
      } else {
        // @TODO : handle multiple files
        const attachmentPayload = Array.isArray(incoming.message.attachment)
          ? incoming.message.attachment[0]
          : incoming.message.attachment;

        return {
          type: Web.InboundMessageType.file,
          data: {
            type: attachmentPayload.type,
            url: await this.channelAttachmentService.getPublicUrl(
              this.getName(),
              attachmentPayload.payload,
            ),
          },
        };
      }
    } else {
      return {
        type: Web.InboundMessageType.text,
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
  private async formatOutgoingHistoryMessage(
    outgoing: OutgoingMessage,
  ): Promise<Web.OutboundMessageBase> {
    const envelope = inferOutgoingMessageEnvelope(outgoing.message);
    const options: ActionOptions =
      'options' in outgoing.message
        ? {
            content: outgoing.message.options,
          }
        : {};

    return await this.outboundMessageEncoder.encode(envelope, options);
  }

  /**
   * Checks if a given message is an IncomingMessage
   *
   * @param message Any type of message
   * @returns True, if it's a incoming message
   */
  private isIncomingMessage(message: AnyMessage): message is IncomingMessage {
    return 'sender' in message && !!message.sender;
  }

  /**
   * Adapt the message structure for web channel
   *
   * @param messages - The messages to be formatted
   *
   * @returns Formatted message
   */
  protected async formatMessages(
    messages: AnyMessage[],
  ): Promise<Web.Message[]> {
    const formattedMessages: Web.Message[] = [];

    for (const anyMessage of messages) {
      const messageMid = anyMessage.mid ?? this.generateId();
      if (this.isIncomingMessage(anyMessage)) {
        const message = await this.formatIncomingHistoryMessage(anyMessage);
        formattedMessages.push({
          ...message,
          author: anyMessage.sender,
          read: true, // Temporary fix as read is false in the bd
          mid: messageMid,
          createdAt: anyMessage.createdAt,
        });
      } else {
        const message = await this.formatOutgoingHistoryMessage(anyMessage);
        formattedMessages.push({
          ...message,
          author: 'chatbot',
          read: true, // Temporary fix as read is false in the bd
          mid: messageMid,
          handover: !!anyMessage.handover,
          createdAt: anyMessage.createdAt,
        });
      }
    }

    return formattedMessages;
  }

  private normalizeThreadId(raw: unknown): string | undefined {
    if (typeof raw !== 'string') {
      return undefined;
    }
    const value = raw.trim();

    return value.length > 0 ? value : undefined;
  }

  private getThreadIdFromQuery(req: SocketRequest): string | undefined {
    const raw = req.query.thread_id;
    const candidate = Array.isArray(raw) ? raw[0] : raw;

    return this.normalizeThreadId(candidate);
  }

  private getThreadIdFromBody(req: SocketRequest): string | undefined {
    const body = req.body as { thread_id?: unknown } | undefined;

    return this.normalizeThreadId(body?.thread_id);
  }

  private async resolveThreadForHistory(
    req: SocketRequest,
  ): Promise<Thread | null> {
    const profile = req.session.web?.profile;
    if (!profile?.id) {
      return null;
    }

    const explicitThreadId =
      this.getThreadIdFromQuery(req) ?? this.getThreadIdFromBody(req);
    const thread = await this.threadService.resolveThread({
      subscriberId: profile.id,
      explicitThreadId,
    });

    if (req.session.web) {
      req.session.web.threadId = thread?.id;
    }

    return thread;
  }

  /**
   * Fetches the messaging history from the DB.
   * @param req - Either an HTTP Express request or a WS SocketRequest (synthetic)
   * @param [until=new Date()] - Date before which to fetch
   * @param [n=30] - Number of messages to fetch
   * @returns Promise resolving to an array of messages.
   * Fetches the last 'n' messages for the session profile up to the given date.
   */
  protected async fetchHistory(
    req: SocketRequest,
    until: Date = new Date(),
    n: number = 30,
  ): Promise<Web.Message[]> {
    const thread = await this.resolveThreadForHistory(req);
    if (thread) {
      const messages = await this.messageService.findHistoryUntilDate(
        thread,
        until,
        n,
      );

      return await this.formatMessages(messages.reverse() as AnyMessage[]);
    }

    return [];
  }

  /**
   * Verify the origin against whitelisted domains.
   *
   * @param req
   * @param res
   */
  private async ensureValidCors(
    req: SocketRequest,
    res: Response | SocketResponse,
  ) {
    // Check if we have an origin header...
    if (!req.headers?.origin) {
      this.logger.debug('No origin ', req.headers);
      throw new Error('CORS - No origin provided!');
    }

    const originUrl = new URL(req.headers.origin);
    const allowedProtocols = new Set(['http:', 'https:']);
    if (!allowedProtocols.has(originUrl.protocol)) {
      throw new Error('CORS - Invalid origin!');
    }

    const settings = await this.getSettings<typeof WEB_CHANNEL_NAME>();
    // Get the allowed origins
    const origins: string[] = settings.allowed_domains.split(',');
    const foundOrigin = origins
      .filter((origin) => origin.trim() !== '*') // Skip "*"
      .map((origin) => {
        try {
          return new URL(origin.trim()).origin;
        } catch (error) {
          this.logger.error(`Invalid URL in allowed domains: ${origin}`, error);

          return null;
        }
      })
      .filter(
        (normalizedOrigin): normalizedOrigin is string =>
          normalizedOrigin !== null,
      )
      .some((origin: string) => {
        // If we find a whitelisted origin, send the Access-Control-Allow-Origin header
        // to greenlight the request.
        return origin === originUrl.origin;
      });

    if (!foundOrigin && !origins.includes('*')) {
      // For HTTP requests, set the Access-Control-Allow-Origin header to '', which the browser will
      // interpret as, 'no way Jose.'
      res.set('Access-Control-Allow-Origin', '');
      this.logger.debug('No origin found ', req.headers.origin);
      throw new Error('CORS - Domain not allowed!');
    } else {
      res.set('Access-Control-Allow-Origin', originUrl.origin);
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
  }

  /**
   * Makes sure that message request is legitimate.
   *
   * @param req
   * @param res
   */
  private async validateSession(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<Subscriber | null> {
    if (req.session.web?.profile?.id) {
      return req.session.web.profile;
    }

    const body = req.body as { author?: unknown; data?: unknown } | undefined;
    const authorForeignId =
      typeof body?.author === 'string' && body.author.trim().length > 0
        ? body.author.trim()
        : undefined;

    if (authorForeignId) {
      try {
        const subscriber =
          await this.subscriberService.findOneByForeignId(authorForeignId);
        if (subscriber) {
          const thread = await this.threadService.resolveThread({
            subscriberId: subscriber.id,
            explicitThreadId:
              this.getThreadIdFromBody(req) ?? this.getThreadIdFromQuery(req),
          });
          req.session.web = {
            profile: subscriber,
            threadId: thread?.id,
          };

          this.logger.debug(
            `Recovered missing web session from author ${authorForeignId}`,
          );

          return subscriber;
        }
      } catch (error) {
        this.logger.warn(
          `Unable to recover missing session from author ${authorForeignId}`,
          error,
        );
      }
    }

    this.logger.warn('No session ID to be found!', req.session);
    res.status(403).json({ err: 'Web Channel Handler : Unauthorized!' });

    return null;
  }

  /**
   * Get or create a session profile for the subscriber
   *
   * @param req
   *
   * @returns Subscriber's profile
   */
  protected async getOrCreateSession(req: SocketRequest): Promise<Subscriber> {
    const data = req.query;
    // Subscriber has already a session
    const sessionProfile = req.session.web?.profile;
    if (sessionProfile) {
      const subscriber = await this.subscriberService.findOne(
        sessionProfile.id,
      );
      if (!subscriber || !req.session.web) {
        throw new Error('Subscriber session was not persisted in DB');
      }
      const thread = await this.threadService.resolveThread({
        subscriberId: subscriber.id,
        explicitThreadId: req.session.web.threadId,
      });
      req.session.web.profile = subscriber;
      req.session.web.threadId = thread?.id;

      return subscriber;
    }

    const newProfile: SubscriberCreateDto = {
      foreignId: this.generateId(),
      firstName: data.first_name ? data.first_name.toString() : 'Anon.',
      lastName: data.last_name ? data.last_name.toString() : 'Web User',
      assignedTo: null,
      assignedAt: null,
      lastvisit: new Date(),
      retainedFrom: new Date(),
      avatar: null,
      channel: {
        name: this.getName(),
        data: this.getChannelAttributes(req),
      },
      language: '',
      locale: '',
      timezone: 0,
      gender: 'male',
      country: '',
      labels: [],
    };
    const profile = await this.subscriberService.create(newProfile);

    req.session.web = {
      profile,
    };

    return profile;
  }

  /**
   * Allow the subscription to a web's webhook after verification
   *
   * @param req
   * @param res
   */
  protected async subscribe(
    req: SocketRequest,
    res: Response | SocketResponse,
  ) {
    this.logger.debug('subscribe (isSocket=true)');
    try {
      const profile = await this.getOrCreateSession(req);
      try {
        await req.socket.join(profile.foreignId);
      } catch (err) {
        this.logger.error('Unable to subscribe via websocket', err);
      }
      // Fetch message history
      const criteria =
        'since' in req.query ? req.query.since : req.body?.since || undefined;
      const messages = await this.fetchHistory(req, criteria);

      return res.status(200).json({
        profile,
        messages,
        thread_id: req.session.web?.threadId ?? null,
      });
    } catch (err) {
      this.logger.warn('Unable to subscribe ', err);

      return res.status(500).json({ err: 'Unable to subscribe' });
    }
  }

  /**
   * Handles upload via WebSocket.
   *
   * @param req - The WebSocket request containing the session and the file data.
   * @returns A Promise that resolves to the stored `Attachment`, or `null` if
   *          the session is invalid or no file is provided.
   * @throws Error if the max upload size is exceeded.
   * @throws Error when storing the uploaded file fails.
   */
  async handleWsUpload(req: SocketRequest): Promise<Attachment | null> {
    try {
      const { type, data } = req.body as Web.InboundMessage;

      if (!req.session.web?.profile?.id) {
        this.logger.debug('No session');

        return null;
      }

      // Check if any file is provided
      if (type !== Web.InboundMessageType.file) {
        this.logger.debug('No files provided');

        return null;
      }
      if (!('file' in data) || !data.file) {
        throw new Error('File payload is missing');
      }

      const size = Buffer.byteLength(data.file);

      if (size > config.parameters.maxUploadSize) {
        throw new Error('Max upload size has been exceeded');
      }

      return await this.attachmentService.store(data.file, {
        name: data.name,
        size,
        type: data.type,
        resourceRef: AttachmentResourceRef.MessageAttachment,
        access: AttachmentAccess.Private,
        createdByRef: AttachmentCreatedByRef.Subscriber,
        createdBy: req.session.web.profile.id,
      });
    } catch (err) {
      this.logger.error('Unable to store uploaded file', err);
      throw new Error('Unable to upload file!');
    }
  }

  /**
   * Upload file as attachment if provided
   *
   * @param req The websocket request object.
   * @returns A Promise that resolves to the uploaded Attachment, or `null` if no file is uploaded.
   * @throws Error Propagated from underlying upload handlers.
   */
  async handleUpload(
    req: SocketRequest,
  ): Promise<Attachment | null | undefined> {
    // Check if any file is provided
    if (!req.session.web) {
      this.logger.debug('No session provided');

      return null;
    }

    return this.handleWsUpload(req);
  }

  /**
   * Returns the request client IP address
   *
   * @param req Either a HTTP request or a WS Request (Synthetic object)
   *
   * @returns IP Address
   */
  protected getIpAddress(req: SocketRequest): string {
    return req.socket.handshake.address;
  }

  /**
   * Return subscriber channel specific attributes
   *
   * @param req Either a HTTP Express request or a WS request (Synthetic Object)
   *
   * @returns The subscriber channel's attributes
   */
  getChannelAttributes(
    req: SocketRequest,
  ): SubscriberChannelDict[typeof WEB_CHANNEL_NAME] {
    return {
      isSocket: true,
      ipAddress: this.getIpAddress(req),
      agent: req.headers['user-agent'] || 'browser',
    };
  }

  /**
   * Handle channel event (probably a message)
   *
   * @param req Either a HTTP Express request or a WS request (Synthetic Object)
   * @param res Either a HTTP Express response or a WS response (Synthetic Object)
   */
  async handleEvent(
    req: SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ): Promise<void> {
    if (!req.body) {
      this.logger.debug('Empty body');
      res.status(400).json({ err: 'Web Channel Handler : Bad Request!' });

      return;
    } else if (
      typeof req.body === 'object' &&
      req.body !== null &&
      'data' in req.body
    ) {
      // Parse json form data (in case of content-type multipart/form-data)
      const payload = req.body as { data?: unknown };
      payload.data =
        typeof payload.data === 'string'
          ? JSON.parse(payload.data)
          : payload.data;
    }

    const profile = await this.validateSession(req, res);
    if (!profile) {
      return;
    }
    const channelAttrs = this.getChannelAttributes(req);
    let events: Array<
      BaseWebInboundEvent<N> | WebMessageInboundEvent<N, Web.InboundMessage>
    >;
    try {
      events = this.inboundEventDecoder.createEvents(
        req.body,
        channelAttrs,
      ) as Array<
        BaseWebInboundEvent<N> | WebMessageInboundEvent<N, Web.InboundMessage>
      >;
    } catch (err) {
      this.logger.warn('Invalid event payload', err);

      return void res
        .status(400)
        .json({ err: 'Web Channel Handler : Bad Request!' });
    }

    if (!events.length) {
      return void res
        .status(400)
        .json({ err: 'Web Channel Handler : Bad Request!' });
    }

    const explicitThreadId =
      this.getThreadIdFromBody(req) ??
      this.getThreadIdFromQuery(req) ??
      req.session.web?.threadId;
    const responseBody = events[0].getRaw();

    for (const event of events) {
      event.setHandler(this);
      if (explicitThreadId) {
        event.setThreadId(explicitThreadId);
      }
      event.setInitiator(profile);
      event.setWorkflowId(workflowId);

      if (event.getEventType() === StdEventType.message) {
        const messageEvent = event as WebMessageInboundEvent<
          N,
          Web.InboundMessage
        >;

        // Handle upload when files are provided
        if (messageEvent instanceof AttachmentMessageInboundEvent) {
          try {
            const attachment = await this.handleUpload(req);

            if (attachment) {
              messageEvent.setUploadedAttachment(attachment);
              messageEvent.setUploadedRawData(
                AttachmentOrmEntity.getTypeByMime(attachment.type),
                await this.channelAttachmentService.getPublicUrl(
                  this.getName(),
                  attachment,
                ),
              );
            }
          } catch (err) {
            this.logger.warn('Unable to upload file ', err);

            return void res
              .status(403)
              .json({ err: 'Web Channel Handler : File upload failed!' });
          }
        }

        // Handle sync message sent by chatbot
        if (messageEvent.isSyncFromChatbot()) {
          const thread = await this.threadService.resolveThread({
            subscriberId: profile.id,
            explicitThreadId,
          });
          if (!thread) {
            return void res.status(409).json({
              err: 'Web Channel Handler : No thread available before first user message',
            });
          }

          messageEvent.setThreadId(thread.id);
          if (req.session.web) {
            req.session.web.threadId = thread.id;
          }
          const sentMessage: MessageCreateDto = {
            mid: messageEvent.getId(),
            message: messageEvent.getMessage() as StdOutgoingMessage,
            recipient: profile.id,
            thread: thread.id,
            read: true,
            delivery: true,
          };
          this.eventEmitter.emit(
            'hook:chatbot:sent',
            sentMessage,
            messageEvent,
          );

          continue;
        }

        // Generate unique ID and handle message
        messageEvent.setMessageId(this.generateId());
        // Force author id from session
        messageEvent.setAuthorForeignId(profile.foreignId);
        // Use a server-side timestamp so realtime clients can sort deterministically.
        messageEvent.setCreatedAt(new Date());

        this.broadcast(profile, StdEventType.message, messageEvent.getRaw());
        await this.eventEmitter.emitAsync('hook:chatbot:message', messageEvent);
        const resolvedThreadId = messageEvent.getThreadId();

        if (resolvedThreadId) {
          messageEvent.setThreadIdOnRaw(resolvedThreadId);
          if (req.session.web) {
            req.session.web.threadId = resolvedThreadId;
          }
        }

        continue;
      }

      const type = event.getEventType();
      const threadId = event.getThreadId();

      if (threadId) {
        event.setThreadIdOnRaw(threadId);
      }
      this.broadcast(profile, type, event.getRaw());
      this.eventEmitter.emit(`hook:chatbot:${type}`, event);
    }

    res.status(200).json(responseBody);
  }

  /**
   * Checks if a given request is a socket request
   *
   * @param req Either a HTTP express request or a WS request
   * @returns True if it's a WS request
   */
  isSocketRequest(req: Request | SocketRequest): req is SocketRequest {
    return 'isSocket' in req && req.isSocket;
  }

  /**
   * Process incoming Web Channel data (finding out its type and assigning it to its proper handler)
   *
   * @param req Either a HTTP Express request or a WS request (Synthetic Object)
   * @param res Either a HTTP Express response or a WS response (Synthetic Object)
   */
  async handle(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ) {
    if (!this.isSocketRequest(req)) {
      this.logger.warn(
        'Web channel over HTTP is no longer supported. Use Socket.IO transport.',
      );

      return res
        .status(403)
        .json({ err: 'Web Channel Handler : Unauthorized!' });
    }

    try {
      await this.ensureValidCors(req, res);
      if (req.method === 'GET') {
        if (req.query._disconnect) {
          req.session.web = undefined;

          return res.status(200).json({ _disconnect: true });
        } else {
          // Handle webhook subscribe requests
          return await this.subscribe(req, res);
        }
      } else {
        // Handle incoming messages (through POST)
        return this.handleEvent(req, res, workflowId);
      }
    } catch (err) {
      this.logger.warn('Request check failed', err);

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
   * Sends a message to the end-user using websocket
   *
   * @param subscriber - End-user toward which message will be sent
   * @param type - The message to be sent (message, typing, ...)
   * @param content - The message payload contain additional settings
   * @param [excludedRooms=[]] - Array of room names to exclude from receiving the message.
   */
  private broadcast(
    subscriber: Subscriber,
    type: StdEventType,
    content: any,
    excludedRooms: string[] = [],
  ): void {
    this.websocketGateway.broadcast(subscriber, type, content, excludedRooms);
  }

  /**
   * Send a Web Channel Message to the end-user
   *
   * @param event - Incoming event/message being responded to
   * @param envelope - The message to be sent {format, message}
   * @param options - Might contain additional settings
   *
   * @returns The web's response, otherwise an error
   */
  async sendMessage(
    event: MessageInboundEvent<N>,
    envelope: StdOutgoingEnvelope,
    options: ActionOptions,
  ): Promise<{ mid: string }> {
    if (envelope.format === OutgoingMessageFormat.system) {
      throw new UnsupportedOutgoingFormatError(envelope.format);
    }

    const messageBase = await this.outboundMessageEncoder.encode(
      envelope,
      options ?? {},
    );
    const subscriber = event.getInitiator();
    const message: Web.OutboundMessage = {
      ...messageBase,
      mid: this.generateId(),
      author: 'chatbot',
      thread_id: event.getThreadId(),
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
        this.logger.error('Failed in sending typing indicator ', err);
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
  async getSubscriberData(
    event: MessageInboundEvent<N>,
  ): Promise<SubscriberCreateDto> {
    const sender = event.getInitiator();
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = sender;
    const subscriber: SubscriberCreateDto = {
      ...rest,
      channel: sender.channel,
    };

    return subscriber;
  }

  /**
   * Checks if the request is authorized to download a given attachment file.
   *
   * @param attachment The attachment object
   * @param req - The HTTP express request object.
   * @return True, if requester is authorized to download the attachment
   */
  public async hasDownloadAccess(attachment: Attachment, req: Request) {
    const subscriberId = req.session.web?.profile?.id;
    if (attachment.access === AttachmentAccess.Public) {
      return true;
    } else if (!subscriberId) {
      this.logger.warn(
        `Unauthorized access attempt to attachment ${attachment.id}`,
      );

      return false;
    } else if (
      attachment.createdByRef === AttachmentCreatedByRef.Subscriber &&
      subscriberId === attachment.createdBy
    ) {
      // Either subscriber wants to access the attachment he sent
      return true;
    } else {
      // Or, he would like to access an attachment sent to him privately
      return await this.messageService.isAttachmentAccessibleBySubscriber(
        subscriberId,
        attachment.id,
      );
    }
  }
}
