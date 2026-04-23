/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IncomingMessageType } from '@hexabot-ai/types';

import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../../types';

import PayloadMessageInboundEvent from './payload.event';

export class QuickReplyInboundEvent<
  N extends ChannelName = ChannelName,
> extends PayloadMessageInboundEvent<N> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.InboundMessage<Web.IncomingPayloadMessage>,
      SubscriberChannelDict[N]
    >,
    payloadValue: string,
    text: string,
  ) {
    super(context, IncomingMessageType.quickReply, payloadValue, text);
  }
}

export default QuickReplyInboundEvent;
