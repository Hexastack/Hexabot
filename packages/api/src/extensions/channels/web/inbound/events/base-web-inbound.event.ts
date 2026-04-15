/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type ChannelHandler from '@/channel/lib/Handler';
import {
  ChannelInboundEvent,
  ChannelInboundEventContext,
} from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../types';

export abstract class BaseWebInboundEvent<
  N extends ChannelName = ChannelName,
  C extends ChannelHandler<N> = ChannelHandler<N>,
> extends ChannelInboundEvent<N, Web.Event, SubscriberChannelDict[N], C> {
  protected constructor(
    context: ChannelInboundEventContext<N, Web.Event, SubscriberChannelDict[N]>,
    handler?: C,
  ) {
    super(context, handler);
  }

  override getRaw<T = Web.Event>(): T {
    return super.getRaw<T>();
  }

  setThreadIdOnRaw(threadId?: string): void {
    const raw = this.getRaw<Record<string, unknown>>();

    if (threadId) {
      raw.thread_id = threadId;
    } else {
      delete raw.thread_id;
    }
  }
}

export default BaseWebInboundEvent;
