/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelName } from '@/channel/types';

import { ChannelInboundEvent } from './channel-inbound-event';

export interface ChannelInboundEventDecoder<
  N extends ChannelName,
  E extends ChannelInboundEvent<N> = ChannelInboundEvent<N>,
  S = SubscriberChannelDict[N],
> {
  readonly channel: N;

  createEvents(raw: unknown, channelAttrs: S): E[];
}

export default ChannelInboundEventDecoder;
