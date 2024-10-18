import {
  DEFAULT_LIVE_CHAT_TEST_SETTINGS,
  LIVE_CHAT_TEST_CHANNEL_NAME,
} from './settings';

declare global {
  interface Settings
    extends SettingTree<typeof DEFAULT_LIVE_CHAT_TEST_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookSettingsGroupLabelOperationMap {
    [name: HyphenToUnderscore<typeof LIVE_CHAT_TEST_CHANNEL_NAME>]: TDefinition<
      object,
      SettingObject<typeof DEFAULT_LIVE_CHAT_TEST_SETTINGS>
    >;
  }
}
