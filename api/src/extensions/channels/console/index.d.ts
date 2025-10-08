/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import CONSOLE_CHANNEL_SETTINGS, {
  CONSOLE_CHANNEL_NAMESPACE,
} from './settings';

declare global {
  interface Settings extends SettingTree<typeof CONSOLE_CHANNEL_SETTINGS> {}
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
    [CONSOLE_CHANNEL_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof CONSOLE_CHANNEL_SETTINGS>
    >;
  }
}
