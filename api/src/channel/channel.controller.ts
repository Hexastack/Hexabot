/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Controller, Get } from '@nestjs/common';

import { ChannelService } from './channel.service';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  /**
   * Retrieves the list of channels.
   *
   * @returns An array of objects where each object represents a channel with a `name` property.
   */
  @Get()
  getChannels(): { name: string }[] {
    return this.channelService.getAll().map((handler) => {
      return {
        name: handler.getName(),
      };
    });
  }
}
