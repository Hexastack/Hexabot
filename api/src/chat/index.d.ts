/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ChannelName } from '@/channel/types';

declare global {
  interface SubscriberChannelDict
    extends Record<ChannelName | string, Record<string, any>> {}
}
