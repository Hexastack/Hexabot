import { CORE_NLU_HELPER_SETTINGS } from './settings';

declare global {
  interface Settings extends SettingTree<typeof CORE_NLU_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookSettingsGroupLabelOperationMap {
    nlu: TDefinition<object, SettingObject<typeof CORE_NLU_HELPER_SETTINGS>>;
  }
}
