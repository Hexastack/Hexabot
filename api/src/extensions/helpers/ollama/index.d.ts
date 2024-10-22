import OLLAMA_HELPER_SETTINGS, { OLLAMA_HELPER_NAMESPACE } from './settings';

declare global {
  interface Settings extends SettingTree<typeof OLLAMA_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [OLLAMA_HELPER_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof OLLAMA_HELPER_SETTINGS>
    >;
  }
}
