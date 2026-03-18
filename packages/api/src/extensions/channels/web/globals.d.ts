/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WEB_CHANNEL_NAME,
  WEB_CHANNEL_NAMESPACE,
  WEB_CHANNEL_SETTING_FIELDS,
  webChannelSettingsSchema,
} from './settings';

type WebChannelSettingsTree = SettingTreeFromSchemaMap<
  Record<typeof WEB_CHANNEL_NAMESPACE, typeof webChannelSettingsSchema>
>;

type WebChannelSettingDefinitions = SettingDefinitionMapFromFields<
  Record<typeof WEB_CHANNEL_NAMESPACE, typeof WEB_CHANNEL_SETTING_FIELDS>
>;

declare global {
  interface Settings extends WebChannelSettingsTree {}

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
      WebChannelSettingDefinitions[typeof WEB_CHANNEL_NAMESPACE]
    >;
  }
}
