/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BasePlugin } from './base-plugin.service';
import { PluginService } from './plugins.service';
import { PluginName, PluginType } from './types';

@Injectable()
export abstract class BaseEventPlugin extends BasePlugin {
  public readonly type: PluginType = PluginType.event;

  constructor(name: PluginName, pluginService: PluginService<BasePlugin>) {
    super(name, pluginService);
  }
}
