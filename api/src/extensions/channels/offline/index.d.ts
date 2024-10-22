import DEFAULT_OFFLINE_SETTINGS, { OFFLINE_GROUP_NAME } from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_OFFLINE_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [OFFLINE_GROUP_NAME]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_OFFLINE_SETTINGS>
    >;
  }
}
