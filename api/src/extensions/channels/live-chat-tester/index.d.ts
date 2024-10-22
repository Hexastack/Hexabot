import DEFAULT_LIVE_CHAT_TEST_SETTINGS, {
  LIVE_CHAT_TEST_GROUP_NAME,
} from './settings';

declare global {
  interface Settings
    extends SettingTree<typeof DEFAULT_LIVE_CHAT_TEST_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [LIVE_CHAT_TEST_GROUP_NAME]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_LIVE_CHAT_TEST_SETTINGS>
    >;
  }
}
