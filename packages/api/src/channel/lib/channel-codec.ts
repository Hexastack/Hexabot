/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { StdOutgoingEnvelope } from '@/chat/types/message';

import type { ChannelName } from '../types';

import type { ChannelInboundEvent } from './inbound-events/channel-inbound-event';

/**
 * A channel's complete wire-format contract: inbound parsing and outbound
 * serialisation in one object.
 *
 * Grouping encoder and decoder here makes it clear they are two sides of the
 * same protocol. Channels that currently provide separate
 * `ChannelInboundEventDecoder` / `ChannelOutboundMessageEncoder` instances
 * can satisfy this interface by composing them.
 *
 * @typeParam N  - Channel name literal
 * @typeParam In - Raw inbound payload type (e.g. the platform's webhook body)
 * @typeParam Out - Encoded outbound message type sent back to the platform
 * @typeParam Opt - Encode-time options (e.g. `ActionOptions`)
 */
export interface ChannelCodec<
  N extends ChannelName,
  In = unknown,
  Out = unknown,
  Opt = unknown,
> {
  /**
   * Parse a raw inbound payload into one or more typed channel events.
   *
   * Returns an array because some platforms batch multiple interactions in a
   * single webhook call (e.g. Facebook's `entry[].messaging[]` structure).
   */
  decode(
    raw: In,
    channelAttrs: SubscriberChannelDict[N],
  ): Promise<ChannelInboundEvent<N>[]> | ChannelInboundEvent<N>[];

  /**
   * Serialise a standard outgoing envelope into the channel's wire format.
   */
  encode(envelope: StdOutgoingEnvelope, options?: Opt): Promise<Out> | Out;
}
