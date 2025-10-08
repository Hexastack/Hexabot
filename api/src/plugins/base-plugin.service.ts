/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
