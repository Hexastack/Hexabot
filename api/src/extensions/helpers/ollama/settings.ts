import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const OLLAMA_HELPER_NAME = 'ollama';

export const OLLAMA_HELPER_GROUP = 'ollama';

export const OLLAMA_HELPER_SETTINGS = [
  {
    label: 'api_url',
    group: OLLAMA_HELPER_GROUP,
    type: SettingType.text,
    value: 'http://ollama:11434', // Default value
  },
  {
    label: 'model',
    group: OLLAMA_HELPER_GROUP,
    type: SettingType.text,
    value: 'tinyllama', // Default model
  },
  {
    label: 'keep_alive',
    group: OLLAMA_HELPER_GROUP,
    type: SettingType.text,
    value: '5m', // Default value for keeping the model in memory
  },
  {
    label: 'mirostat',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default: disabled
  },
  {
    label: 'mirostat_eta',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.1, // Default value
  },
  {
    label: 'mirostat_tau',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 5.0, // Default value
  },
  {
    label: 'num_ctx',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 2048, // Default value
  },
  {
    label: 'repeat_last_n',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 64, // Default value
  },
  {
    label: 'repeat_penalty',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 1.1, // Default value
  },
  {
    label: 'temperature',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.8, // Default value
  },
  {
    label: 'seed',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default value
  },
  {
    label: 'stop',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.text,
    value: 'AI assistant:', // Default stop sequence
  },
  {
    label: 'tfs_z',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 1, // Default value, 1.0 means disabled
  },
  {
    label: 'num_predict',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 20, // Default value
  },
  {
    label: 'top_k',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 40, // Default value
  },
  {
    label: 'top_p',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.9, // Default value
  },
  {
    label: 'min_p',
    group: OLLAMA_HELPER_GROUP,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.0, // Default value
  },
] as const satisfies HelperSetting<typeof OLLAMA_HELPER_NAME>[];
