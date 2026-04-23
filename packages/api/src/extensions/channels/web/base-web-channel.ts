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
import {
  ChannelCapabilities,
  DEFAULT_CHANNEL_CAPABILITIES,
} from '@/channel/lib/channel-capabilities';
import { MessageInboundEvent } from '@/channel/lib/inbound-events';
import { WebSocketChannelHandler } from '@/channel/lib/transports';
import { ChannelName } from '@/channel/types';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { Subscriber, SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { MessageService } from '@/chat/services/message.service';
import {
  StdEventType,
  StdOutgoingMessageEnvelope,
  StdOutgoingMessage,
} from '@/chat/types/message';
import { ActionOptions } from '@/chat/types/options';
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

@Injectable()
export default abstract class BaseWebChannelHandler<N extends ChannelName>
  extends WebSocketChannelHandler<N>
  implements OnModuleInit
{
  @Inject(MenuService)
  private readonly menuService: MenuService;

  @Inject(MessageService)
  private readonly messageService: MessageService;

  private outboundMessageEncoder!: WebOutboundMessageEncoder;

  private inboundEventDecoder!: WebInboundEventDecoder<N>;

  private sessionService!: WebSessionService;

  private historyService!: WebHistoryService;

  constructor(name: N) {
    super(name);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit() {
    await super.onModuleInit();

    const [encoder, decoder, session, history] = await Promise.all([
      this.createModuleRef(createWebOutboundMessageEncoder(this.getName())),
      this.createModuleRef(createWebInboundEventDecoder(this.getName())),
      this.createModuleRef(WebSessionService),
      this.createModuleRef(WebHistoryService),
    ]);

    this.outboundMessageEncoder = encoder as WebOutboundMessageEncoder;
    this.inboundEventDecoder = decoder as WebInboundEventDecoder<N>;
    this.sessionService = session;
    this.historyService = history;

    this.logger.debug('initialization ...');
  }

  // ── Capabilities ───────────────────────────────────────────────────────────

  getCapabilities(): ChannelCapabilities {
    return { ...DEFAULT_CHANNEL_CAPABILITIES, typingIndicator: true };
  }

  // ── Identity helpers ───────────────────────────────────────────────────────

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

  // ── Private format context factory ────────────────────────────────────────

  private formatCtx(): WebFormatContext {
    return {
      encoder: this.outboundMessageEncoder,
      channelName: this.getName(),
      generateId: () => this.generateId(),
    };
  }

  // ── Socket.IO events ───────────────────────────────────────────────────────

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

  // ── CORS (wrapper keeps the method accessible to tests + sub-classes) ──────

  private async ensureValidCors(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<void> {
    const settings = await this.getSettings<typeof WEB_CHANNEL_NAME>();
    await this.sessionService.validateCors(req, res, settings.allowed_domains);
  }

  // ── Session (wrappers delegate to WebSessionService) ──────────────────────

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

  // ── History (wrapper delegates to WebHistoryService) ──────────────────────

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

  // ── Subscription flow ──────────────────────────────────────────────────────

  protected async subscribe(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<void> {
    this.logger.debug('subscribe (isSocket=true)');
    try {
      const profile = await this.getOrCreateSession(req);
      try {
        await req.socket.join(profile.foreignId);
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

  // ── File upload ────────────────────────────────────────────────────────────

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

  // ── Inbound event dispatch ─────────────────────────────────────────────────

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
            message: messageEvent.getMessage() as StdOutgoingMessage,
            recipient: profile.id,
            thread: thread.id,
            read: true,
            delivery: true,
          };
          this.channelEventBus.emitSent(sentMessage, messageEvent);
          continue;
        }

        messageEvent.setMessageId(this.generateId());
        messageEvent.setAuthorForeignId(profile.foreignId);
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

  // ── Socket transport hooks ─────────────────────────────────────────────────

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

  // ── Outbound ───────────────────────────────────────────────────────────────

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

  async getSubscriberData(
    event: MessageInboundEvent<N>,
  ): Promise<SubscriberCreateDto> {
    const sender = event.getInitiator();
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = sender;

    return { ...rest, channel: sender.channel };
  }

  // ── Download access ────────────────────────────────────────────────────────

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
