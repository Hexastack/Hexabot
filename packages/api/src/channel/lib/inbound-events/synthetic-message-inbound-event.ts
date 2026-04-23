/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  IncomingMessageType,
  Payload,
  PayloadType,
  StdIncomingMessage,
} from '@hexabot-ai/types';

import { ChannelName } from '../../types';
import type ChannelHandler from '../Handler';

import { ChannelInboundEventContext } from './channel-inbound-event-context';
import MessageInboundEvent from './message-inbound-event';

export class SyntheticMessageInboundEvent<
  N extends ChannelName = ChannelName,
  S = SubscriberChannelDict[N],
  C extends ChannelHandler<N> = ChannelHandler<N>,
> extends MessageInboundEvent<N, Record<string, unknown>, S, C> {
  constructor(
    context: ChannelInboundEventContext<N, Record<string, unknown>, S>,
    private readonly message: StdIncomingMessage,
    private readonly messageType: IncomingMessageType,
    handler?: C,
  ) {
    super(context, handler);
  }

  override getMessageType(): IncomingMessageType {
    return this.messageType;
  }

  override getPayload(): Payload | string | undefined {
    if (
      this.message.type === IncomingMessageType.postback ||
      this.message.type === IncomingMessageType.quick_reply
    ) {
      return this.message.data.payload;
    }

    if (this.message.type === IncomingMessageType.location) {
      return {
        type: PayloadType.location,
        coordinates: {
          lat: this.message.data.coordinates.lat,
          lon: this.message.data.coordinates.lon,
        },
      };
    }

    if (this.message.type === IncomingMessageType.attachments) {
      const attachment = Array.isArray(this.message.data.attachment)
        ? this.message.data.attachment[0]
        : this.message.data.attachment;

      if (!attachment) {
        return undefined;
      }

      return {
        type: PayloadType.attachments,
        attachment,
      };
    }

    return undefined;
  }

  override toStdIncomingMessage(): StdIncomingMessage {
    return this.message;
  }
}

export default SyntheticMessageInboundEvent;
