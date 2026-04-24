/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelMetadata } from '@hexabot-ai/types';
import { Controller, Get } from '@nestjs/common';

import { RuntimeSettingsService } from '@/setting/services/runtime-settings.service';

import { ChannelService } from './channel.service';

@Controller('channel')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly runtimeSettingsService: RuntimeSettingsService,
  ) {}

  /**
   * Retrieves the list of channels.
   *
   * @returns An array of objects where each object represents a channel with a `name` property.
   */
  @Get()
  getChannels(): ChannelMetadata[] {
    const schemaDefinitions =
      this.runtimeSettingsService.getAllSchemaDefinitions();

    return this.channelService.getAll().map((handler) => {
      const channelName = handler.getName();
      const schemaDefinition = schemaDefinitions[channelName];

      return {
        name: channelName,
        settingsSchema:
          schemaDefinition?.extensionType === 'channel'
            ? (schemaDefinition.schema as Record<string, unknown>)
            : {},
      };
    });
  }
}
