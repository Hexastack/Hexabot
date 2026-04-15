/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { Injectable, Type } from '@nestjs/common';

import {
  ChannelInboundEvent,
  ChannelInboundEventContext,
  ChannelInboundEventDecoder,
} from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../types';

import DeliveryNotificationInboundEvent from './events/delivery.event';
import AttachmentMessageInboundEvent from './events/messages/attachment.event';
import LocationMessageInboundEvent from './events/messages/location.event';
import PostbackInboundEvent from './events/messages/postback.event';
import QuickReplyInboundEvent from './events/messages/quick-reply.event';
import TextMessageInboundEvent from './events/messages/text.event';
import ReadNotificationInboundEvent from './events/read.event';
import TypingNotificationInboundEvent from './events/typing.event';
import UnsupportedInboundEvent from './events/unsupported.event';

export class WebInboundEventDecoder<N extends ChannelName = ChannelName>
  implements
    ChannelInboundEventDecoder<
      N,
      ChannelInboundEvent<N, Web.Event, SubscriberChannelDict[N]>,
      SubscriberChannelDict[N]
    >
{
  readonly channel: N;

  constructor(channel: N) {
    this.channel = channel;
  }

  createEvents(
    raw: unknown,
    channelAttrs: SubscriberChannelDict[N],
  ): Array<ChannelInboundEvent<N, Web.Event, SubscriberChannelDict[N]>> {
    const event = Web.eventSchema.parse(raw);

    // Array on purpose: some channels may fan out one raw webhook
    // into several semantic events later.
    return [this.createEvent(event, channelAttrs)];
  }

  private createEvent(
    event: Web.Event,
    channelAttrs: SubscriberChannelDict[N],
  ): ChannelInboundEvent<N, Web.Event, SubscriberChannelDict[N]> {
    switch (event.type) {
      case Web.StatusEventType.delivery:
        return new DeliveryNotificationInboundEvent(
          this.createContext(event, channelAttrs),
          event.mid,
        );

      case Web.StatusEventType.read:
        return new ReadNotificationInboundEvent(
          this.createContext(event, channelAttrs),
          event.watermark ?? 0,
        );

      case Web.StatusEventType.typing:
        return new TypingNotificationInboundEvent(
          this.createContext(event, channelAttrs),
        );

      case Web.InboundMessageType.text:
        return new TextMessageInboundEvent(
          this.createContext(event, channelAttrs),
          event.data.text,
        );

      case Web.InboundMessageType.quick_reply:
        return new QuickReplyInboundEvent(
          this.createContext(event, channelAttrs),
          event.data.payload,
          event.data.text,
        );

      case Web.InboundMessageType.postback:
        return new PostbackInboundEvent(
          this.createContext(event, channelAttrs),
          event.data.payload,
          event.data.text,
        );

      case Web.InboundMessageType.location:
        return new LocationMessageInboundEvent(
          this.createContext(event, channelAttrs),
          event.data.coordinates.lat,
          event.data.coordinates.lng,
        );

      case Web.InboundMessageType.file: {
        const originalName =
          'name' in event.data && typeof event.data.name === 'string'
            ? event.data.name
            : undefined;

        return new AttachmentMessageInboundEvent(
          this.createContext(event, channelAttrs),
          event.data.type,
          originalName,
        );
      }

      default:
        return new UnsupportedInboundEvent(
          this.createContext(event, channelAttrs),
          `Unsupported web event type: ${String(
            (event as { type?: unknown }).type ?? 'unknown',
          )}`,
        );
    }
  }

  private createContext<T extends Web.Event>(
    event: T,
    channelAttrs: SubscriberChannelDict[N],
  ): ChannelInboundEventContext<N, T, SubscriberChannelDict[N]> {
    return new ChannelInboundEventContext(
      this.channel,
      event,
      channelAttrs,
      this.getOccurredAt(event),
      this.getEventId(event),
      this.getSenderForeignId(event),
      null, // keep same v2 behavior for now
    );
  }

  private getOccurredAt(event: Web.Event): Date {
    if ('timestamp' in event && typeof event.timestamp === 'number') {
      const date = new Date(event.timestamp);

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    if ('createdAt' in event && event.createdAt instanceof Date) {
      const date = event.createdAt;

      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date();
  }

  private getEventId(event: Web.Event): string {
    if (
      'mid' in event &&
      typeof event.mid === 'string' &&
      event.mid.length > 0
    ) {
      return event.mid;
    }

    return randomUUID();
  }

  private getSenderForeignId(event: Web.Event): string | null {
    if ('author' in event && typeof event.author === 'string') {
      return event.author;
    }

    return null;
  }
}

export function createWebInboundEventDecoder<N extends ChannelName>(
  channelName: N,
): Type<WebInboundEventDecoder<N>> {
  @Injectable()
  class BoundWebInboundEventDecoder extends WebInboundEventDecoder<N> {
    constructor() {
      super(channelName);
    }
  }

  return BoundWebInboundEventDecoder;
}

export default WebInboundEventDecoder;
