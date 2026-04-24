/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type {
  Attachment,
  StdOutgoingMessageEnvelope,
  Subscriber,
} from '@hexabot-ai/types';
import {
  ActionOptions,
  AnyMessage,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
  StdEventType,
} from '@hexabot-ai/types';
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

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentResourceRef,
} from '@/attachment/types';
import {
  ChannelCapabilities,
  DEFAULT_CHANNEL_CAPABILITIES,
  ExtensionInject,
  WebSocketChannelHandler,
} from '@/channel';
import { MessageInboundEvent } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';
import { SubscriberChannelData } from '@/chat';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { MessageService } from '@/chat/services/message.service';
import { MenuService } from '@/cms/services/menu.service';
import { config } from '@/config';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import {
  AttachmentMessageInboundEvent,
  BaseWebInboundEvent,
  createWebInboundEventDecoder,
  WebInboundEventDecoder,
  WebMessageInboundEvent,
} from './inbound';
import { WebInboundMessageEncoder } from './inbound/web-inbound-message-encoder';
import {
  createWebOutboundMessageEncoder,
  WebOutboundMessageEncoder,
} from './outbound';
import {
  WebFormatContext,
  WebHistoryService,
} from './services/web-history.service';
import { WebSessionService } from './services/web-session.service';
import { Web } from './types';
import { WEB_CHANNEL_NAME } from './web-channel.settings';

/**
 * Base handler for the Socket.IO-backed "web" channel.
 *
 * Responsibilities:
 * - resolves per-channel helpers via `@ExtensionInject()` (encoder/decoder, session, history)
 * - enforces web-channel CORS rules for the HTTP socket transport endpoints
 * - manages web session bootstrap and thread resolution
 * - decodes inbound web events and broadcasts outbound messages over Socket.IO
 */
@Injectable()
export default abstract class BaseWebChannelHandler<N extends ChannelName>
  extends WebSocketChannelHandler<N>
  implements OnModuleInit
{
  @Inject(MenuService)
  private readonly menuService: MenuService;

  @Inject(MessageService)
  private readonly messageService: MessageService;

  @ExtensionInject((name) => createWebOutboundMessageEncoder(name))
  private outboundMessageEncoder!: WebOutboundMessageEncoder;

  @ExtensionInject(WebInboundMessageEncoder)
  private inboundMessageEncoder!: WebInboundMessageEncoder;

  @ExtensionInject((name) => createWebInboundEventDecoder(name))
  private inboundEventDecoder!: WebInboundEventDecoder<N>;

  @ExtensionInject(WebSessionService)
  private sessionService!: WebSessionService;

  @ExtensionInject(WebHistoryService)
  private historyService!: WebHistoryService;

  constructor(name: N) {
    super(name);
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.logger.debug('initialization ...');
  }

  getCapabilities(): ChannelCapabilities {
    return { ...DEFAULT_CHANNEL_CAPABILITIES, typingIndicator: true };
  }

  generateId(): string {
    return `${this.name}-${uuidv4()}`;
  }

  getChannelAttributes(
    req: SocketRequest,
  ): SubscriberChannelDict[typeof WEB_CHANNEL_NAME] {
    return {
      isSocket: true,
      ipAddress: this.getIpAddress(req),
      agent: req.headers['user-agent'] || 'browser',
    };
  }

  private formatCtx(): WebFormatContext {
    return {
      inboundEncoder: this.inboundMessageEncoder,
      outboundEncoder: this.outboundMessageEncoder,
      channelName: this.getName(),
      generateId: () => this.generateId(),
    };
  }

  @OnEvent('hook:websocket:connection', { async: true })
  async onWebSocketConnection(client: Socket) {
    try {
      const handshake = client.handshake;
      const { channel } = handshake.query;
      const profile = client.request.session.web?.profile;

      if (channel !== this.getName()) return;

      let messages: Web.Message[] | undefined;
      let threadId: string | undefined;

      if (profile?.foreignId) {
        await client.join(profile.foreignId);
        const thread = await this.sessionService.resolveThread(
          profile.id,
          client.request.session.web?.threadId,
        );
        threadId = thread?.id;
        client.request.session.web = {
          profile: client.request.session.web?.profile,
          threadId,
        };
        messages = thread
          ? await this.historyService.fetchHistory(thread, this.formatCtx())
          : [];
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
    switch (incoming.message.type) {
      case IncomingMessageType.text:
        return {
          type: Web.InboundMessageType.text,
          data: incoming.message.data,
        };
      case IncomingMessageType.postback:
        return {
          type: Web.InboundMessageType.postback,
          data: incoming.message.data,
        };
      case IncomingMessageType.quickReply:
        return {
          type: Web.InboundMessageType.quick_reply,
          data: incoming.message.data,
        };
      case IncomingMessageType.location: {
        const coordinates = incoming.message.data.coordinates;

        return {
          type: Web.InboundMessageType.location,
          data: {
            coordinates: {
              lat: coordinates.lat,
              lng: coordinates.lon,
            },
          },
        };
      }
      case IncomingMessageType.attachment: {
        // @TODO : handle multiple files
        const attachmentPayload = Array.isArray(
          incoming.message.data.attachment,
        )
          ? incoming.message.data.attachment[0]
          : incoming.message.data.attachment;

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
      default:
        return {
          type: Web.InboundMessageType.text,
          data: { text: '' },
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
    const envelope = outgoing.message;
    const options: ActionOptions =
      envelope.type === OutgoingMessageType.list ||
      envelope.type === OutgoingMessageType.carousel
        ? {
            content: envelope.data.options,
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

  /**
   * Verify the origin against whitelisted domains.
   *
   * @param req
   * @param res
   */
  private async ensureValidCors(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<void> {
    const settings = await this.getSettings<typeof WEB_CHANNEL_NAME>();
    await this.sessionService.validateCors(req, res, settings.allowed_domains);
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
    return this.sessionService.validateSession(req, res);
  }

  protected async getOrCreateSession(req: SocketRequest): Promise<Subscriber> {
    return this.sessionService.getOrCreateSession(req, () => {
      const data = req.query;

      return {
        foreignId: this.generateId(),
        firstName: data.first_name ? String(data.first_name) : 'Anon.',
        lastName: data.last_name ? String(data.last_name) : 'Web User',
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
    });
  }

  /**
   * Fetches the messaging history from the DB.
   *
   * @param req - Either an HTTP Express request or a WS SocketRequest (synthetic)
   * @param [until=new Date()] - Date before which to fetch
   * @param [n=30] - Number of messages to fetch
   * @returns Promise resolving to an array of messages.
   * Fetches the last 'n' messages for the session profile up to the given date.
   */
  protected async fetchHistory(
    req: SocketRequest,
    until?: Date,
    n?: number,
  ): Promise<Web.Message[]> {
    return this.historyService.fetchHistoryForRequest(
      req,
      this.sessionService,
      this.formatCtx(),
      until,
      n,
    );
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
  ): Promise<void> {
    this.logger.debug('subscribe (isSocket=true)');
    try {
      const profile = await this.getOrCreateSession(req);
      const profileForeignId = profile.foreignId;
      if (!profileForeignId) {
        throw new Error('Session profile foreignId is missing');
      }
      try {
        await req.socket.join(profileForeignId);
      } catch (err) {
        this.logger.error('Unable to subscribe via websocket', err);
      }
      const criteria =
        'since' in req.query ? req.query.since : (req.body?.since ?? undefined);
      const messages = await this.fetchHistory(req, criteria);

      res.status(200).json({
        profile,
        messages,
        thread_id: req.session.web?.threadId ?? null,
      });
    } catch (err) {
      this.logger.warn('Unable to subscribe ', err);
      res.status(500).json({ err: 'Unable to subscribe' });
    }
  }

  /**
   * Handles upload via WebSocket.
   *
   * @param req - The WebSocket request containing the session and the file data.
   * @returns A Promise that resolves to the stored `Attachment`, or `null` if
   *          the session is invalid or no file is provided.
   * @throws Error if missing file payload.
   * @throws Error if the max upload size is exceeded.
   * @throws Error when storing the uploaded file fails.
   */
  async handleWsUpload(req: SocketRequest): Promise<Attachment | null> {
    try {
      const { type, data } = req.body as Web.InboundMessage;

      if (!req.session.web?.profile?.id) {
        this.logger.debug('No session provided');

        return null;
      }
      if (type !== Web.InboundMessageType.file) {
        this.logger.debug('No files provided');

        return null;
      }
      if (!('file' in data) || !data.file) {
        throw new Error('File payload is missing');
      }

      const { name: fileName, type: mimeType } = data as {
        name: string;
        type: string;
      };
      const size = Buffer.byteLength(data.file);

      if (size > config.parameters.maxUploadSize) {
        throw new Error('Max upload size has been exceeded');
      }

      return await this.attachmentService.store(data.file, {
        name: fileName,
        size,
        type: mimeType,
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
   * Handle channel event (probably a message)
   *
   * @param req - WS request (Synthetic Object)
   * @param res - Either a HTTP Express response or a WS response (Synthetic Object)
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
    }

    if (
      typeof req.body === 'object' &&
      req.body !== null &&
      'data' in req.body
    ) {
      const payload = req.body as { data?: unknown };
      payload.data =
        typeof payload.data === 'string'
          ? JSON.parse(payload.data)
          : payload.data;
    }

    const profile = await this.validateSession(req, res);
    if (!profile) return;

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
      this.sessionService.getThreadIdFromBody(req) ??
      this.sessionService.getThreadIdFromQuery(req) ??
      req.session.web?.threadId;
    const responseBody = events[0].getRaw();

    for (const event of events) {
      event.setHandler(this);
      if (explicitThreadId) event.setThreadId(explicitThreadId);
      event.setInitiator(profile);
      event.setWorkflowId(workflowId);

      if (event.getEventType() === StdEventType.message) {
        const messageEvent = event as WebMessageInboundEvent<
          N,
          Web.InboundMessage
        >;

        if (messageEvent instanceof AttachmentMessageInboundEvent) {
          try {
            const attachment = await this.handleWsUpload(req);
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

        if (messageEvent.isSyncFromChatbot()) {
          const thread = await this.sessionService.resolveThreadForHistory(
            req,
            profile.id,
          );
          if (!thread) {
            return void res.status(409).json({
              err: 'Web Channel Handler : No thread available before first user message',
            });
          }
          messageEvent.setThreadId(thread.id);
          if (req.session.web) req.session.web.threadId = thread.id;

          const sentMessage: MessageCreateDto = {
            mid: messageEvent.getId(),
            message: {
              type: OutgoingMessageType.text,
              data: { text: messageEvent.getText() },
            },
            recipient: profile.id,
            thread: thread.id,
            read: true,
            delivery: true,
          };
          this.channelEventBus.emitSent(sentMessage, messageEvent);
          continue;
        }

        messageEvent.setMessageId(this.generateId());
        if (profile.foreignId) {
          messageEvent.setAuthorForeignId(profile.foreignId);
        }
        messageEvent.setCreatedAt(new Date());

        this.broadcast(profile, StdEventType.message, messageEvent.getRaw());
        await this.channelEventBus.emitMessage(messageEvent);

        const resolvedThreadId = messageEvent.getThreadId();
        if (resolvedThreadId) {
          messageEvent.setThreadIdOnRaw(resolvedThreadId);
          if (req.session.web) req.session.web.threadId = resolvedThreadId;
        }

        continue;
      }

      const type = event.getEventType();
      const threadId = event.getThreadId();
      if (threadId) event.setThreadIdOnRaw(threadId);
      this.broadcast(profile, type, event.getRaw());
      this.channelEventBus.emitStatusEvent(event);
    }

    res.status(200).json(responseBody);
  }

  protected async processSocketGet(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<void> {
    try {
      await this.ensureValidCors(req, res);
      if (req.query._disconnect) {
        req.session.web = undefined;

        return void res.status(200).json({ _disconnect: true });
      }
      await this.subscribe(req, res);
    } catch (err) {
      this.logger.warn('Request check failed', err);
      res.status(403).json({ err: 'Web Channel Handler : Unauthorized!' });
    }
  }

  protected async processSocketPost(
    req: SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ): Promise<void> {
    try {
      await this.ensureValidCors(req, res);
      await this.handleEvent(req, res, workflowId);
    } catch (err) {
      this.logger.warn('Request check failed', err);
      res.status(403).json({ err: 'Web Channel Handler : Unauthorized!' });
    }
  }

  protected async doSendMessage(
    event: MessageInboundEvent<N>,
    envelope: StdOutgoingMessageEnvelope,
    options: ActionOptions,
  ): Promise<{ mid: string }> {
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
    const send = async (): Promise<{ mid: string }> => {
      this.broadcast(subscriber, StdEventType.message, message);

      return { mid: message.mid };
    };

    if (options?.typing) {
      const autoTimeout =
        message?.data && 'text' in message.data
          ? message.data.text.length * 10
          : 1000;
      const timeout =
        typeof options.typing === 'number' ? options.typing : autoTimeout;
      try {
        await this.sendTypingIndicator(subscriber, timeout);

        return send();
      } catch (err) {
        this.logger.error('Failed in sending typing indicator ', err);
      }
    }

    return send();
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
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = sender;

    return { ...rest, channel: sender.channel as SubscriberChannelData<N> };
  }

  /**
   * Checks if the request is authorized to download a given attachment file.
   * Can be overridden by the channel handler to customize, by default it shouldn't
   * allow any client to download a subscriber attachment for example.
   *
   * @param attachment The attachment object
   * @param req - The HTTP express request object.
   * @return True, if requester is authorized to download the attachment
   */
  public async hasDownloadAccess(attachment: Attachment, req: Request) {
    const subscriberId = req.session.web?.profile?.id;

    if (attachment.access === AttachmentAccess.Public) return true;

    if (!subscriberId) {
      this.logger.warn(
        `Unauthorized access attempt to attachment ${attachment.id}`,
      );

      return false;
    }

    if (
      attachment.createdByRef === AttachmentCreatedByRef.Subscriber &&
      subscriberId === attachment.createdBy
    ) {
      return true;
    }

    return this.messageService.isAttachmentAccessibleBySubscriber(
      subscriberId,
      attachment.id,
    );
  }
}
