import { HelperSetting } from '@/helper/lib/types';
import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export const OLLAMA_GROUP_NAME = 'ollama';

export const OLLAMA_HELPER_SETTINGS = [
  {
    label: 'api_url',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: 'http://ollama:11434', // Default value
    weight: 0,
  },
  {
    label: 'model',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: 'tinyllama', // Default model
    weight: 1,
  },
  {
    label: 'keep_alive',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: '5m', // Default value for keeping the model in memory
    weight: 2,
  },
  {
    label: 'mirostat',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default: disabled
    weight: 3,
  },
  {
    label: 'mirostat_eta',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.1, // Default value
    weight: 4,
  },
  {
    label: 'mirostat_tau',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 5.0, // Default value
    weight: 5,
  },
  {
    label: 'num_ctx',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 2048, // Default value
    weight: 6,
  },
  {
    label: 'repeat_last_n',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 64, // Default value
    weight: 7,
  },
  {
    label: 'repeat_penalty',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 1.1, // Default value
    weight: 8,
  },
  {
    label: 'temperature',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.8, // Default value
    weight: 9,
  },
  {
    label: 'seed',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default value
    weight: 10,
  },
  {
    label: 'stop',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.text,
    value: 'AI assistant:', // Default stop sequence
    weight: 11,
  },
  {
    label: 'tfs_z',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 1, // Default value, 1.0 means disabled
    weight: 12,
  },
  {
    label: 'num_predict',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 20, // Default value
    weight: 13,
  },
  {
    label: 'top_k',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 40, // Default value
    weight: 14,
  },
  {
    label: 'top_p',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.9, // Default value
    weight: 15,
  },
  {
    label: 'min_p',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.0, // Default value
    weight: 16,
  },
] as const satisfies HelperSetting[];

export const OLLAMA_PLUGIN_SETTINGS = [
  {
    label: 'model',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: 'tinyllama', // Default model
    weight: 1,
  },
  {
    label: 'keep_alive',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: '5m', // Default value for keeping the model in memory
    weight: 2,
  },
  {
    label: 'max_messages_ctx',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.number,
    value: 5, // Default number of messages to retrieve for context
    weight: 3,
  },
  {
    label: 'context',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.text,
    value: `You are an AI Assistant that works for Hexastack, the IT company behind Hexabot the chatbot builder.`, // Default value for keeping the model in memory
    weight: 4,
  },
  {
    label: 'instructions',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.textarea,
    value: `Answer the user QUESTION using the DOCUMENTS text above. Keep your answer ground in the facts of the DOCUMENT. If the DOCUMENT doesn’t contain the facts to answer the QUESTION, apologize and try to give an answer that promotes the company and its values. DO NOT SAY ANYTHING ABOUT THESE DOCUMENTS, nor their EXISTENCE.`,
    weight: 5,
  },
  {
    label: 'fallback_message',
    group: OLLAMA_GROUP_NAME,
    type: SettingType.textarea,
    value: `Something went wrong ... please try again later.`,
    weight: 5,
  },
  {
    label: 'mirostat',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default: disabled
    weight: 3,
  },
  {
    label: 'mirostat_eta',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.1, // Default value
    weight: 4,
  },
  {
    label: 'mirostat_tau',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 5.0, // Default value
    weight: 5,
  },
  {
    label: 'num_ctx',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 2048, // Default value
    weight: 6,
  },
  {
    label: 'repeat_last_n',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 64, // Default value
    weight: 7,
  },
  {
    label: 'repeat_penalty',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 1.1, // Default value
    weight: 8,
  },
  {
    label: 'temperature',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.8, // Default value
    weight: 9,
  },
  {
    label: 'seed',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0, // Default value
    weight: 10,
  },
  {
    label: 'stop',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.text,
    value: 'AI assistant:', // Default stop sequence
    weight: 11,
  },
  {
    label: 'tfs_z',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 1, // Default value, 1.0 means disabled
    weight: 12,
  },
  {
    label: 'num_predict',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 20, // Default value
    weight: 13,
  },
  {
    label: 'top_k',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 40, // Default value
    weight: 14,
  },
  {
    label: 'top_p',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.9, // Default value
    weight: 15,
  },
  {
    label: 'min_p',
    group: OLLAMA_GROUP_NAME,
    subgroup: 'options',
    type: SettingType.number,
    value: 0.0, // Default value
    weight: 16,
  },
] as const satisfies PluginSetting[];
