/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AnyMessage,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  Thread,
} from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';

import { ChannelAttachmentService } from '@/channel/services/channel-attachment.service';
import { ChannelName } from '@/channel/types';
import { MessageService } from '@/chat/services/message.service';
import { SocketRequest } from '@/websocket/utils/socket-request';

import { WebOutboundMessageEncoder } from '../outbound/web-outbound-message-encoder';
import { Web } from '../types';

import { WebSessionService } from './web-session.service';

/**
 * Context bundle passed to formatting methods so they don't need the handler.
 * Groups the three channel-specific pieces that vary between web and console.
 */
export interface WebFormatContext {
  encoder: WebOutboundMessageEncoder;
  channelName: ChannelName;
  generateId: () => string;
}

/**
 * Handles message history fetching and all wire-format conversion for the
 * web / console channels.
 *
 * Instantiated per-channel through `@ExtensionInject()` on the channel handler.
 * The base `ChannelHandler` resolves these providers during `onModuleInit()` via
 * `ModuleRef.create()`, so each channel gets its own DI-scoped instance.
 */
@Injectable()
export class WebHistoryService {
  constructor(
    private readonly messageService: MessageService,
    private readonly channelAttachmentService: ChannelAttachmentService,
  ) {}

  /**
   * Fetches the message history for the subscriber's thread and converts it
   * to the web wire format.
   *
   * @param thread   - Resolved thread (null returns empty array).
   * @param ctx      - Channel-specific formatting context.
   * @param until    - Return messages older than this date (default: now).
   * @param n        - Maximum number of messages (default: 30).
   */
  async fetchHistory(
    thread: Thread | null,
    ctx: WebFormatContext,
    until: Date = new Date(),
    n: number = 30,
  ): Promise<Web.Message[]> {
    if (!thread) return [];

    const messages = await this.messageService.findHistoryUntilDate(
      thread,
      until,
      n,
    );

    return this.formatMessages(messages.reverse() as AnyMessage[], ctx);
  }

  /**
   * Resolves a thread from the request session, then fetches and formats the
   * history. Convenience wrapper used by the subscribe/history flows.
   */
  async fetchHistoryForRequest(
    req: SocketRequest,
    sessionService: WebSessionService,
    ctx: WebFormatContext,
    until?: Date,
    n?: number,
  ): Promise<Web.Message[]> {
    const profile = req.session.web?.profile;
    if (!profile?.id) return [];

    const thread = await sessionService.resolveThreadForHistory(
      req,
      profile.id,
    );

    return this.fetchHistory(thread, ctx, until, n);
  }

  /**
   * Converts an array of persisted messages (inbound or outbound) to the web
   * wire format, preserving chronological order.
   */
  async formatMessages(
    messages: AnyMessage[],
    ctx: WebFormatContext,
  ): Promise<Web.Message[]> {
    const result: Web.Message[] = [];

    for (const msg of messages) {
      const mid = msg.mid ?? ctx.generateId();

      if (this.isIncomingMessage(msg)) {
        const formatted = await this.formatIncomingMessage(msg, ctx);
        result.push({
          ...formatted,
          author: msg.sender,
          read: true,
          mid,
          createdAt: msg.createdAt,
        });
      } else {
        const formatted = await this.formatOutgoingMessage(msg, ctx);
        result.push({
          ...formatted,
          author: 'chatbot',
          read: true,
          mid,
          handover: !!msg.handover,
          createdAt: msg.createdAt,
        });
      }
    }

    return result;
  }

  private isIncomingMessage(msg: AnyMessage): msg is IncomingMessage {
    return 'sender' in msg && !!msg.sender;
  }

  private async formatIncomingMessage(
    incoming: IncomingMessage,
    ctx: WebFormatContext,
  ): Promise<Web.InboundMessageBase> {
    if (incoming.message.type === IncomingMessageType.location) {
      const { lat, lon } = incoming.message.data.coordinates;

      return {
        type: Web.InboundMessageType.location,
        data: { coordinates: { lat, lng: lon } },
      };
    }

    // Attachment — use first item when stored as array
    const attachmentPayload = Array.isArray(incoming.message.data)
      ? incoming.message.data[0]
      : incoming.message.data;

    return {
      type: Web.InboundMessageType.file,
      data: {
        type: attachmentPayload.type,
        url: await this.channelAttachmentService.getPublicUrl(
          ctx.channelName,
          attachmentPayload.payload,
        ),
      },
    };
  }

  private async formatOutgoingMessage(
    outgoing: OutgoingMessage,
    ctx: WebFormatContext,
  ): Promise<Web.OutboundMessageBase> {
    return ctx.encoder.encode(outgoing.message);
  }
}
