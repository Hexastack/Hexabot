import CONSOLE_CHANNEL_SETTINGS, {
  CONSOLE_CHANNEL_NAMESPACE,
} from './settings';

declare global {
  interface Settings extends SettingTree<typeof CONSOLE_CHANNEL_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [CONSOLE_CHANNEL_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof CONSOLE_CHANNEL_SETTINGS>
    >;
  }
}
