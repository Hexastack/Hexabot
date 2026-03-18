/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  CONSOLE_CHANNEL_NAME,
  CONSOLE_CHANNEL_NAMESPACE,
  CONSOLE_CHANNEL_SETTING_FIELDS,
  consoleChannelSettingsSchema,
} from './settings';

type ConsoleChannelSettingsTree = SettingTreeFromSchemaMap<
  Record<typeof CONSOLE_CHANNEL_NAMESPACE, typeof consoleChannelSettingsSchema>
>;

type ConsoleChannelSettingDefinitions = SettingDefinitionMapFromFields<
  Record<
    typeof CONSOLE_CHANNEL_NAMESPACE,
    typeof CONSOLE_CHANNEL_SETTING_FIELDS
  >
>;

declare global {
  interface Settings extends ConsoleChannelSettingsTree {}

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
      ConsoleChannelSettingDefinitions[typeof CONSOLE_CHANNEL_NAMESPACE]
    >;
  }
}
