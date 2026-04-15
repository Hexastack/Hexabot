/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type ChannelHandler from '@/channel/lib/Handler';
import {
  ChannelInboundEventContext,
  MessageInboundEvent,
} from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../../types';

export abstract class WebMessageInboundEvent<
  N extends ChannelName = ChannelName,
  T extends Web.InboundMessageBase = Web.InboundMessageBase,
  C extends ChannelHandler<N> = ChannelHandler<N>,
> extends MessageInboundEvent<N, T, SubscriberChannelDict[N], C> {
  protected constructor(
    context: ChannelInboundEventContext<N, T, SubscriberChannelDict[N]>,
    handler?: C,
  ) {
    super(context, handler);
  }

  override getRaw<R = T>(): R {
    return super.getRaw<R>();
  }

  isSyncFromChatbot(): boolean {
    const raw = this.getRaw<Web.InboundMessage>();

    return raw.sync === true && raw.author === 'chatbot';
  }

  setMessageId(mid: string): void {
    this.setEventId(mid);
    const raw = this.getRaw<Web.InboundMessage>();

    raw.mid = mid;
  }

  setAuthorForeignId(author: string): void {
    this.setSenderForeignId(author);
    const raw = this.getRaw<Web.InboundMessage>();

    raw.author = author;
  }

  setCreatedAt(createdAt: Date): void {
    this.setOccurredAt(createdAt);
    const raw = this.getRaw<Web.InboundMessage>();

    raw.createdAt = createdAt;
  }

  setThreadIdOnRaw(threadId?: string): void {
    const raw = this.getRaw<Record<string, unknown>>();

    if (threadId) {
      raw.thread_id = threadId;
    } else {
      delete raw.thread_id;
    }
  }
}

export default WebMessageInboundEvent;
