import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const CORE_NLU_HELPER_NAME = 'core-nlu-helper';

export const CORE_NLU_HELPER_GROUP = 'core_nlu_helper';

export default [
  {
    group: CORE_NLU_HELPER_GROUP,
    label: 'endpoint',
    value: 'http://nlu-api:5000/',
    type: SettingType.text,
  },
  {
    group: CORE_NLU_HELPER_GROUP,
    label: 'token',
    value: 'token123',
    type: SettingType.text,
  },
  {
    group: CORE_NLU_HELPER_GROUP,
    label: 'threshold',
    value: 0.1,
    type: SettingType.number,
    config: {
      min: 0,
      max: 1,
      step: 0.01,
    },
  },
] as const satisfies HelperSetting<typeof CORE_NLU_HELPER_NAME>[];
