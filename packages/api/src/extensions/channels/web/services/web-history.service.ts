/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ActionOptions,
  AnyMessage,
  IncomingMessage,
  OutgoingMessage,
  OutgoingMessageType,
  Thread,
} from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';

import { MessageService } from '@/chat/services/message.service';
import { SocketRequest } from '@/websocket/utils/socket-request';

import { WebInboundMessageEncoder } from '../inbound/web-inbound-message-encoder';
import { WebOutboundMessageEncoder } from '../outbound/web-outbound-message-encoder';
import { Web } from '../types';

import { WebSessionService } from './web-session.service';

/**
 * Context bundle passed to formatting methods so they don't need the handler.
 * Groups channel-specific pieces that vary between web and console.
 */
export interface WebFormatContext {
  inboundEncoder: WebInboundMessageEncoder;
  outboundEncoder: WebOutboundMessageEncoder;
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
  constructor(private readonly messageService: MessageService) {}

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
        const formatted = await ctx.inboundEncoder.encode(msg.message);
        result.push({
          ...formatted,
          author: msg.sender,
          read: true,
          mid,
          createdAt: msg.createdAt,
        });
      } else {
        const formatted = await ctx.outboundEncoder.encode(
          msg.message,
          this.resolveOutgoingEncodeOptions(msg),
        );
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

  private resolveOutgoingEncodeOptions(
    outgoing: OutgoingMessage,
  ): ActionOptions {
    const envelope = outgoing.message;
    if (
      envelope.type === OutgoingMessageType.list ||
      envelope.type === OutgoingMessageType.carousel
    ) {
      return { content: envelope.data.options };
    }

    return {};
  }
}
