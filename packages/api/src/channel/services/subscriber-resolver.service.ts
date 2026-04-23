/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { Subscriber, SubscriberCreateDto } from '@/chat/dto/subscriber.dto';
import { SubscriberService } from '@/chat/services/subscriber.service';

import type ChannelInboundEvent from '../lib/inbound-events/channel-inbound-event';
import type MessageInboundEvent from '../lib/inbound-events/message-inbound-event';
import { ChannelName } from '../types';

/**
 * Implement this on any object that can supply subscriber identity data.
 * HttpChannelHandler satisfies this interface directly via its abstract methods.
 */
export interface SubscriberResolution<N extends ChannelName> {
  getSubscriberData(
    event: MessageInboundEvent<N>,
  ): Promise<SubscriberCreateDto>;
  normalizeSenderId?(rawSenderId: string): string;
}

/**
 * Single authoritative place for the lookup-or-create subscriber flow.
 *
 * Extracted from HttpChannelHandler so the same logic is available to both
 * HTTP and WebSocket transports without duplication.
 */
@Injectable()
export class SubscriberResolver {
  constructor(private readonly subscriberService: SubscriberService) {}

  /**
   * Find the existing subscriber for the event's sender, or create one.
   *
   * @param event - The inbound channel event carrying the sender identity.
   * @param resolution - Delegate that provides `getSubscriberData` and the
   *   optional `normalizeSenderId` for the owning channel handler.
   */
  async resolve<N extends ChannelName>(
    event: ChannelInboundEvent<N>,
    resolution: SubscriberResolution<N>,
  ): Promise<Subscriber> {
    const rawForeignId = event.getSenderForeignId();

    if (!rawForeignId) {
      throw new Error(
        `Cannot resolve subscriber: ${event.constructor.name} has no sender foreign ID`,
      );
    }

    const foreignId = resolution.normalizeSenderId
      ? resolution.normalizeSenderId(rawForeignId)
      : rawForeignId;
    const existing = await this.subscriberService.findOneByForeignId(foreignId);

    if (existing) {
      return existing;
    }

    const subscriberData = await resolution.getSubscriberData(
      event as unknown as MessageInboundEvent<N>,
    );

    return this.subscriberService.create({
      ...subscriberData,
      foreignId,
    });
  }
}
