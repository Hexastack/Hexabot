/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
