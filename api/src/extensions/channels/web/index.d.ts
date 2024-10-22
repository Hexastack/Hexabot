import DEFAULT_WEB_CHANNEL_SETTINGS, {
  WEB_CHANNEL_NAMESPACE,
} from './settings';

declare global {
  interface Settings extends SettingTree<typeof DEFAULT_WEB_CHANNEL_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [WEB_CHANNEL_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof DEFAULT_WEB_CHANNEL_SETTINGS>
    >;
  }
}
