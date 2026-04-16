/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AnySetting, ExtensionSetting } from '@/setting/types';

export type ChannelName = `${string}-channel`;

export type ChannelSetting<N extends string = string> = ExtensionSetting<
  {
    group: N;
  },
  AnySetting,
  'id' | 'createdAt' | 'updatedAt' | 'group'
>;
