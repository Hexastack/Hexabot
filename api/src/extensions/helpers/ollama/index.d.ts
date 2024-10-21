import { OLLAMA_HELPER_GROUP, OLLAMA_HELPER_SETTINGS } from './settings';

declare global {
  interface Settings extends SettingTree<typeof OLLAMA_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [OLLAMA_HELPER_GROUP]: TDefinition<
      object,
      SettingMapByType<typeof OLLAMA_HELPER_SETTINGS>
    >;
  }
}
