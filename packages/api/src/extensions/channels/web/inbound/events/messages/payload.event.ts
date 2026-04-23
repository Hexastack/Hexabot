/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  IncomingMessageType,
  StdIncomingMessage,
  Payload,
} from '@hexabot-ai/types';

import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../../types';

import WebMessageInboundEvent from './web-message.event';

export abstract class PayloadMessageInboundEvent<
  N extends ChannelName = ChannelName,
> extends WebMessageInboundEvent<
  N,
  Web.InboundMessage<Web.IncomingPayloadMessage>
> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.InboundMessage<Web.IncomingPayloadMessage>,
      SubscriberChannelDict[N]
    >,
    private readonly messageType:
      | IncomingMessageType.postback
      | IncomingMessageType.quickReply,
    private readonly payloadValue: string,
    private readonly text: string,
  ) {
    super(context);
  }

  override getMessageType(): IncomingMessageType {
    return this.messageType;
  }

  override getPayload(): Payload | string {
    return this.payloadValue;
  }

  override toStdIncomingMessage(): StdIncomingMessage {
    return {
      type: this.messageType,
      data: {
        payload: this.payloadValue,
        text: this.text,
      },
    };
  }
}

export default PayloadMessageInboundEvent;
