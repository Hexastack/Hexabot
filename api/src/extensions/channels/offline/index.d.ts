import DEFAULT_OFFLINE_SETTINGS, {
  OFFLINE_CHANNEL_NAMESPACE,
} from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_OFFLINE_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [OFFLINE_CHANNEL_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_OFFLINE_SETTINGS>
    >;
  }
}
