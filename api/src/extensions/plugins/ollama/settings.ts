/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'model',
    group: 'default',
    type: SettingType.text,
    value: 'llama3.2', // Default model
  },
  {
    label: 'keep_alive',
    group: 'default',
    type: SettingType.text,
    value: '5m', // Default value for keeping the model in memory
  },
  {
    label: 'max_messages_ctx',
    group: 'default',
    type: SettingType.number,
    value: 5, // Default number of messages to retrieve for context
  },
  {
    label: 'context',
    group: 'default',
    type: SettingType.text,
    value: `You are an AI Assistant that works for Hexastack, the IT company behind Hexabot the chatbot builder.`, // Default value for keeping the model in memory
  },
  {
    label: 'instructions',
    group: 'default',
    type: SettingType.textarea,
    value: `Answer the user QUESTION using the DOCUMENTS text above. Keep your answer ground in the facts of the DOCUMENT. If the DOCUMENT doesn’t contain the facts to answer the QUESTION, apologize and try to give an answer that promotes the company and its values. DO NOT SAY ANYTHING ABOUT THESE DOCUMENTS, nor their EXISTENCE.`,
  },
  {
    label: 'fallback_message',
    group: 'default',
    type: SettingType.textarea,
    value: `Something went wrong ... please try again later.`,
  },
  {
    label: 'mirostat',
    group: 'options',
    type: SettingType.number,
    value: 0, // Default: disabled
  },
  {
    label: 'mirostat_eta',
    group: 'options',
    type: SettingType.number,
    value: 0.1, // Default value
  },
  {
    label: 'mirostat_tau',
    group: 'options',
    type: SettingType.number,
    value: 5.0, // Default value
  },
  {
    label: 'num_ctx',
    group: 'options',
    type: SettingType.number,
    value: 2048, // Default value
  },
  {
    label: 'repeat_last_n',
    group: 'options',
    type: SettingType.number,
    value: 64, // Default value
  },
  {
    label: 'repeat_penalty',
    group: 'options',
    type: SettingType.number,
    value: 1.1, // Default value
  },
  {
    label: 'temperature',
    group: 'options',
    type: SettingType.number,
    value: 0.8, // Default value
  },
  {
    label: 'seed',
    group: 'options',
    type: SettingType.number,
    value: 0, // Default value
  },
  {
    label: 'stop',
    group: 'options',
    type: SettingType.text,
    value: 'AI assistant:', // Default stop sequence
  },
  {
    label: 'tfs_z',
    group: 'options',
    type: SettingType.number,
    value: 1, // Default value, 1.0 means disabled
  },
  {
    label: 'num_predict',
    group: 'options',
    type: SettingType.number,
    value: 20, // Default value
  },
  {
    label: 'top_k',
    group: 'options',
    type: SettingType.number,
    value: 40, // Default value
  },
  {
    label: 'top_p',
    group: 'options',
    type: SettingType.number,
    value: 0.9, // Default value
  },
  {
    label: 'min_p',
    group: 'options',
    type: SettingType.number,
    value: 0.0, // Default value
  },
] as const satisfies PluginSetting[];
