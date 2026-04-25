/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { IntegrationHealthItem, Source } from '@hexabot-ai/types';

export type ChannelName = string;

export type ChannelHealthContext = {
  checkedAt: string;
  sources: Source[];
  defaultHealth: IntegrationHealthItem;
};

export type ChannelHealthResult = Partial<IntegrationHealthItem> | void;

export interface ChannelHealthProvider {
  getIntegrationHealth(
    context: ChannelHealthContext,
  ): ChannelHealthResult | Promise<ChannelHealthResult>;
}
