/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import type ChannelHandler from '../lib/Handler';
import { ChannelName } from '../types';

@Injectable()
export class ChannelRegistry {
  private readonly registry = new Map<string, ChannelHandler<ChannelName>>();

  setChannel<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
    channel: C,
  ): void {
    this.registry.set(name, channel);
  }

  getAll(): ChannelHandler<ChannelName>[] {
    return Array.from(this.registry.values());
  }

  findChannel(name: ChannelName): ChannelHandler<ChannelName> | undefined {
    return this.registry.get(name);
  }

  getChannelHandler<T extends ChannelName, C extends ChannelHandler<T>>(
    name: T,
  ): C {
    const handler = this.registry.get(name);
    if (!handler) {
      throw new Error(`Channel ${name} not found`);
    }

    return handler as C;
  }
}
