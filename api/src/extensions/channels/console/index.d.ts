/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
