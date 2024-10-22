/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import {
  OutgoingMessageFormat,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { LoggerService } from '@/logger/logger.service';
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
