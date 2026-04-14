/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';
import { IncomingMessageType, StdIncomingMessage } from '@/chat/types/message';

import { Web } from '../../../types';

import WebMessageInboundEvent from './web-message.event';

export class TextMessageInboundEvent<
  N extends ChannelName = ChannelName,
> extends WebMessageInboundEvent<
  N,
  Web.IncomingMessage<Web.IncomingTextMessage>
> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.IncomingMessage<Web.IncomingTextMessage>,
      SubscriberChannelDict[N]
    >,
    private readonly text: string,
  ) {
    super(context);
  }

  override getMessageType(): IncomingMessageType {
    return IncomingMessageType.message;
  }

  override toStdIncomingMessage(): StdIncomingMessage {
    return {
      text: this.text,
    };
  }
}

export default TextMessageInboundEvent;
