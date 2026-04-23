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

export class ReadNotificationInboundEvent<
  N extends ChannelName = ChannelName,
> extends BaseWebInboundEvent<N> {
  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.StatusReadEvent,
      SubscriberChannelDict[N]
    >,
    private readonly watermark: number,
  ) {
    super(context);
  }

  override getEventType(): StdEventType {
    return StdEventType.read;
  }

  getWatermark(): number {
    return this.watermark / 1000;
  }
}

export default ReadNotificationInboundEvent;
