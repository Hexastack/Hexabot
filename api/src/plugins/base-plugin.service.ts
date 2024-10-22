/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, OnModuleInit } from '@nestjs/common';

import { Extension } from '@/utils/generics/extension';

import { PluginService } from './plugins.service';
import { PluginName, PluginType } from './types';

@Injectable()
export abstract class BasePlugin extends Extension implements OnModuleInit {
  public readonly type: PluginType;

  constructor(
    public readonly name: PluginName,
    private pluginService: PluginService<BasePlugin>,
  ) {
    super(name);
  }

  async onModuleInit() {
    await super.onModuleInit();
    this.pluginService.setPlugin(this.type, this.name, this);
  }
}
