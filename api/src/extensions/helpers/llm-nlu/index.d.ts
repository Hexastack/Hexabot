/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import LLM_NLU_HELPER_SETTINGS, { LLM_NLU_HELPER_NAMESPACE } from './settings';

declare global {
  interface Settings extends SettingTree<typeof LLM_NLU_HELPER_SETTINGS> {}
}

declare module '@nestjs/event-emitter' {
  interface IHookExtensionsOperationMap {
    [LLM_NLU_HELPER_NAMESPACE]: TDefinition<
      object,
      SettingMapByType<typeof LLM_NLU_HELPER_SETTINGS>
    >;
  }
}
