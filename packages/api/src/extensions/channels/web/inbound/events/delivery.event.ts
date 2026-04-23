/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StdEventType } from '@hexabot-ai/types';

import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../types';

import BaseWebInboundEvent from './base-web-inbound.event';

export class DeliveryNotificationInboundEvent<
  N extends ChannelName = ChannelName,
> extends BaseWebInboundEvent<N> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.StatusDeliveryEvent,
      SubscriberChannelDict[N]
    >,
    private readonly deliveredMessageId: string,
  ) {
    super(context);
  }

  override getEventType(): StdEventType {
    return StdEventType.delivery;
  }

  getDeliveredMessages(): string[] {
    return [this.deliveredMessageId];
  }
}

export default DeliveryNotificationInboundEvent;
