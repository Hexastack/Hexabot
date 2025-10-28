/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import { Injectable } from '@nestjs/common';

import { Block, BlockFull } from '@/chat/dto/block.dto';
import { Context } from '@/chat/types/context';
import { StdOutgoingEnvelope } from '@/chat/types/message';

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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
