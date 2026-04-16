/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_SETTINGS_SCHEMA,
} from './web-channel.settings';

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
      SettingMapByType<typeof WEB_CHANNEL_SETTINGS_SCHEMA>
    >;
  }
}
