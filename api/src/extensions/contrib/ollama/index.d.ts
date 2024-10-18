import { OLLAMA_HELPER_SETTINGS } from './settings';

declare global {
  interface Settings extends SettingTree<typeof OLLAMA_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookSettingsGroupLabelOperationMap {
    ollama: TDefinition<object, SettingObject<typeof OLLAMA_HELPER_SETTINGS>>;
  }
}
