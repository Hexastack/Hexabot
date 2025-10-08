/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { BaseBlockPlugin } from './base-block-plugin';
import { BaseEventPlugin } from './base-event-plugin';
import { BasePlugin } from './base-plugin.service';
import { PluginType } from './types';

const PLUGIN_TYPE_MAP = {
  [PluginType.event]: BaseEventPlugin,
  [PluginType.block]: BaseBlockPlugin,
};

export type PluginTypeMap = typeof PLUGIN_TYPE_MAP;

export type PluginInstance<T extends PluginType> = InstanceType<
  PluginTypeMap[T]
> &
  BasePlugin;
