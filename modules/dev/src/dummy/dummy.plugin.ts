/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { Injectable } from '@nestjs/common';

import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/types/message';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate, PluginSetting } from '@/plugins/types';

@Injectable()
export class DummyPlugin extends BaseBlockPlugin<PluginSetting[]> {
  template: PluginBlockTemplate = { name: 'Dummy Plugin' };

  constructor(
    pluginService: PluginService,
    private logger: LoggerService,
  ) {
    super('dummy-plugin', pluginService);

    this.effects = {
      onStoreContextData: () => {},
    };
  }

  getPath(): string {
    return __dirname;
  }

  async process() {
    const envelope: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: 'Hello world !',
      },
    };

    return envelope;
  }
}
