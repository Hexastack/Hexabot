import { DEFAULT_OFFLINE_SETTINGS, OFFLINE_CHANNEL_NAME } from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_OFFLINE_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookSettingsGroupLabelOperationMap {
    [key: HyphenToUnderscore<typeof OFFLINE_CHANNEL_NAME>]: TDefinition<
      object,
      SettingObject<typeof DEFAULT_OFFLINE_SETTINGS>
    >;
  }
}
