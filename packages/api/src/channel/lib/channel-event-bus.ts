/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { MessageCreateDto } from '@/chat/dto/message.dto';

import type ChannelInboundEvent from './inbound-events/channel-inbound-event';
import type MessageInboundEvent from './inbound-events/message-inbound-event';

/**
 * Typed facade over EventEmitter2 for chatbot hook integration.
 *
 * Injected into every ChannelHandler via NestJS DI. Using the facade instead
 * of raw string-based emitAsync/emit calls makes the integration contract
 * explicit and compiler-checkable.
 */
@Injectable()
export class ChannelEventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /** Dispatch a user-initiated message to the chatbot engine. */
  async emitMessage(event: MessageInboundEvent): Promise<void> {
    await this.eventEmitter.emitAsync('hook:chatbot:message', event);
  }

  /**
   * Record a chatbot-originated message that was synchronised from the client
   * side (e.g. web widget sending a bot reply for history storage).
   */
  emitSent(message: MessageCreateDto, event: MessageInboundEvent): void {
    this.eventEmitter.emit('hook:chatbot:sent', message, event);
  }

  /**
   * Dispatch a non-message status event (delivery, read, typing, follow, …).
   * The hook key is derived from the event's own `getEventType()` value.
   */
  emitStatusEvent(event: ChannelInboundEvent): void {
    const type = event.getEventType();

    this.eventEmitter.emit(`hook:chatbot:${type}`, event);
  }
}
