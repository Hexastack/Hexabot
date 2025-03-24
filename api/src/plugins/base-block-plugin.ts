/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import path from 'path';

import { Injectable } from '@nestjs/common';

import { Block, BlockFull } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import { StdOutgoingEnvelope } from '@/chat/schemas/types/message';

import { BasePlugin } from './base-plugin.service';
import { PluginService } from './plugins.service';
import {
  PluginBlockTemplate,
  PluginEffects,
  PluginName,
  PluginSetting,
  PluginType,
} from './types';

@Injectable()
export abstract class BaseBlockPlugin<
  T extends PluginSetting[],
> extends BasePlugin {
  public readonly type: PluginType = PluginType.block;

  private readonly settings: T;

  constructor(name: PluginName, pluginService: PluginService<BasePlugin>) {
    super(name, pluginService);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.settings = require(path.join(this.getPath(), 'settings')).default;
  }

  getDefaultSettings(): Promise<T> | T {
    return this.settings;
  }

  abstract template: PluginBlockTemplate;

  effects?: PluginEffects;

  abstract process(
    block: Block | BlockFull,
    context: Context,
    convId?: string,
  ): Promise<StdOutgoingEnvelope>;

  protected getArguments(block: Block) {
    if ('args' in block.message) {
      return (
        Object.entries(block.message.args)
          // Filter out old settings
          .filter(
            ([argKey]) =>
              this.settings.findIndex(({ label }) => label === argKey) !== -1,
          )
          .reduce(
            (acc, [k, v]) => ({
              ...acc,
              [k]: v,
            }),
            {} as SettingObject<T>,
          )
      );
    }
    throw new Error(`Block ${block.name} does not have any arguments.`);
  }
}
