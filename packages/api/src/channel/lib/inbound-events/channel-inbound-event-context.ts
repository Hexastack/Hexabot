/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelName } from '@/channel/types';

export class ChannelInboundEventContext<
  N extends ChannelName = ChannelName,
  R = unknown,
  S = SubscriberChannelDict[N],
> {
  constructor(
    private readonly channel: N,
    private readonly raw: R,
    private readonly channelAttrs: S,
    private occurredAt: Date = new Date(),
    private eventId: string | null = null,
    private senderForeignId: string | null = null,
    private recipientForeignId: string | null = null,
  ) {}

  getChannel(): N {
    return this.channel;
  }

  getRaw<T = R>(): T {
    return this.raw as unknown as T;
  }

  getChannelAttrs<T = S>(): T {
    return this.channelAttrs as unknown as T;
  }

  getOccurredAt(): Date {
    return this.occurredAt;
  }

  setOccurredAt(occurredAt: Date): void {
    this.occurredAt = occurredAt;
  }

  getEventId(): string | null {
    return this.eventId;
  }

  setEventId(eventId: string | null): void {
    this.eventId = eventId;
  }

  getSenderForeignId(): string | null {
    return this.senderForeignId;
  }

  setSenderForeignId(senderForeignId: string | null): void {
    this.senderForeignId = senderForeignId;
  }

  getRecipientForeignId(): string | null {
    return this.recipientForeignId;
  }

  setRecipientForeignId(recipientForeignId: string | null): void {
    this.recipientForeignId = recipientForeignId;
  }
}
