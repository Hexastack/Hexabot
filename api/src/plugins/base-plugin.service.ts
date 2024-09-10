/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';

import { PluginService } from './plugins.service';
import { PluginType } from './types';

@Injectable()
export abstract class BasePlugin implements OnModuleInit {
  public readonly type: PluginType;

  constructor(
    public readonly id: string,
    private pluginService: PluginService<BasePlugin>,
  ) {}

  onModuleInit() {
    this.pluginService.setPlugin(this.type, this.id, this);
  }
}
