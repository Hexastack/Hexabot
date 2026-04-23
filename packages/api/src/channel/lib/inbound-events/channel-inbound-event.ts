/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber, StdEventType } from '@hexabot-ai/types';

import { SubscriberChannelData } from '@/chat/types/channel';
import { WorkflowType } from '@/workflow/types';

import { TriggerEventWrapper } from '../../../workflow/lib/trigger-event-wrapper';
import { ChannelName } from '../../types';
import type ChannelHandler from '../Handler';

import { ChannelInboundEventContext } from './channel-inbound-event-context';

export abstract class ChannelInboundEvent<
  N extends ChannelName = ChannelName,
  R = unknown,
  S = SubscriberChannelDict[N],
  C extends ChannelHandler<N> = ChannelHandler<N>,
> extends TriggerEventWrapper<Subscriber> {
  readonly triggerType = WorkflowType.conversational;

  protected handler?: C;

  protected constructor(
    protected readonly context: ChannelInboundEventContext<N, R, S>,
    handler?: C,
  ) {
    super();
    this.handler = handler;
  }

  abstract getEventType(): StdEventType;

  setHandler(handler: C): void {
    this.handler = handler;
  }

  getHandler(): C {
    if (!this.handler) {
      throw new Error(
        `Handler is not available for ${this.constructor.name} event`,
      );
    }

    return this.handler;
  }

  getChannel(): N {
    return this.context.getChannel();
  }

  getOccurredAt(): Date {
    return this.context.getOccurredAt();
  }

  protected setOccurredAt(occurredAt: Date): void {
    this.context.setOccurredAt(occurredAt);
  }

  getRaw<T = R>(): T {
    return this.context.getRaw<T>();
  }

  getChannelAttrs<T = S>(): T {
    return this.context.getChannelAttrs<T>();
  }

  getChannelData(): SubscriberChannelData<N> {
    return {
      name: this.getChannel(),
      ...this.getChannelAttrs<Record<string, unknown>>(),
    } as SubscriberChannelData<N>;
  }

  protected requireEventId(): string {
    const eventId = this.context.getEventId();

    if (!eventId) {
      throw new Error(`Event id is not available for ${this.constructor.name}`);
    }

    return eventId;
  }

  protected setEventId(eventId: string | null): void {
    this.context.setEventId(eventId);
  }

  protected requireSenderForeignId(): string {
    const senderForeignId = this.context.getSenderForeignId();

    if (!senderForeignId) {
      throw new Error(
        `Sender foreign id is not available for ${this.constructor.name}`,
      );
    }

    return senderForeignId;
  }

  protected setSenderForeignId(senderForeignId: string | null): void {
    this.context.setSenderForeignId(senderForeignId);
  }

  protected setRecipientForeignId(recipientForeignId: string | null): void {
    this.context.setRecipientForeignId(recipientForeignId);
  }

  getMetadata(): Record<string, unknown> {
    return {
      channel: this.getChannelData(),
      thread_id: this.getThreadId() ?? null,
    };
  }

  getContextData(): Record<string, unknown> {
    return {
      channel: this.getChannelData(),
      initiator: this.getInitiator(),
      threadId: this.getThreadId() ?? null,
    };
  }

  buildInput(): Record<string, unknown> {
    return {
      thread_id: this.getThreadId() ?? '',
    };
  }
}

export default ChannelInboundEvent;
