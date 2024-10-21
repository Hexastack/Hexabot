/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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
