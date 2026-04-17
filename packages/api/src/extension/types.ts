/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ChannelName } from '@/channel/types';
import { HelperName } from '@/helper/types';

export type TExtension = 'channel' | 'helper';

export type TExtractGroup<T extends TExtension> = T extends 'channel'
  ? ChannelName
  : HelperName;

export type TCriteria<T extends TExtension = TExtension> = {
  extensionType: T;
  groups: TExtractGroup<T>[];
};
