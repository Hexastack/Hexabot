import { CORE_NLU_HELPER_GROUP, CORE_NLU_HELPER_SETTINGS } from './settings';

declare global {
  interface Settings extends SettingTree<typeof CORE_NLU_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [CORE_NLU_HELPER_GROUP]: TDefinition<
      object,
      SettingMapByType<typeof CORE_NLU_HELPER_SETTINGS>
    >;
  }
}
