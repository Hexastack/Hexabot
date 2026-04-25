/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { z } from 'zod';

import {
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_SOURCE_SETTINGS_SCHEMA,
} from './settings.schema';

declare global {
  interface SubscriberChannelDict {
    [WEB_CHANNEL_NAME]: {
      isSocket: boolean;
      ipAddress: string;
      agent: string;
    };
  }
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [WEB_CHANNEL_NAME]: TDefinition<
      object,
      z.infer<typeof WEB_CHANNEL_SOURCE_SETTINGS_SCHEMA>
    >;
  }
}
