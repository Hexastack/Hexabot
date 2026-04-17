/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  CONSOLE_CHANNEL_NAME,
  CONSOLE_CHANNEL_SETTINGS_SCHEMA,
} from './console-channel.settings';

declare global {
  interface SubscriberChannelDict {
    [CONSOLE_CHANNEL_NAME]: {
      isSocket: boolean;
      ipAddress: string;
      agent: string;
    };
  }
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [CONSOLE_CHANNEL_NAME]: TDefinition<
      object,
      SettingMapByType<typeof CONSOLE_CHANNEL_SETTINGS_SCHEMA>
    >;
  }
}
