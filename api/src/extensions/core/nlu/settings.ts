import { SettingCreateDto } from '@/setting/dto/setting.dto';
import { SettingType } from '@/setting/schemas/types';

export const CORE_NLU_HELPER_SETTINGS = [
  {
    group: 'nlu',
    label: 'provider',
    value: 'default',
    options: ['default'],
    type: SettingType.select,
    weight: 1,
  },
  {
    group: 'nlu',
    label: 'endpoint',
    value: 'http://nlu-api:5000/',
    type: SettingType.text,
    weight: 2,
  },
  {
    group: 'nlu',
    label: 'token',
    value: 'token123',
    type: SettingType.text,
    weight: 3,
  },
  {
    group: 'nlu',
    label: 'threshold',
    value: 0.1,
    type: SettingType.number,
    config: {
      min: 0,
      max: 1,
      step: 0.01,
    },
    weight: 4,
  },
] as const satisfies SettingCreateDto[];
