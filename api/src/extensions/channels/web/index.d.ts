/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import DEFAULT_WEB_CHANNEL_SETTINGS, {
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_NAMESPACE,
} from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_WEB_CHANNEL_SETTINGS> {}

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
    [WEB_CHANNEL_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_WEB_CHANNEL_SETTINGS>
    >;
  }
}
