import { BaseBlockPlugin } from './base-block-plugin';
import { BaseEventPlugin } from './base-event-plugin';
import { BasePlugin } from './base-plugin.service';
import { BaseStoragePlugin } from './base-storage-plugin';
import { PluginType } from './types';

const PLUGIN_TYPE_MAP = {
  [PluginType.event]: BaseEventPlugin,
  [PluginType.block]: BaseBlockPlugin,
  [PluginType.storage]: BaseStoragePlugin,
};

export type PluginTypeMap = typeof PLUGIN_TYPE_MAP;

export type PluginInstance<T extends PluginType> = InstanceType<
  PluginTypeMap[T]
> &
  BasePlugin;
