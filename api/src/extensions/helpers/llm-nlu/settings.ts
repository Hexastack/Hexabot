/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { HelperSetting } from '@/helper/types';
import { SettingType } from '@/setting/schemas/types';

export const LLM_NLU_HELPER_NAME = 'llm-nlu-helper';

export const LLM_NLU_HELPER_NAMESPACE = 'llm_nlu_helper';

export default [
  {
    group: LLM_NLU_HELPER_NAMESPACE,
    label: 'model',
    value: '',
    type: SettingType.text,
  },
  {
    group: LLM_NLU_HELPER_NAMESPACE,
    label: 'language_classifier_prompt_template',
    value: `You are an advanced language detection assistant. Your task is to identify the language of the given input text from the following supported languages:

{{#each languages}}
- {{title}} (code={{code}})
{{/each}}

Provide a concise result by stating the language code only. If the language is not in the supported list, return an empty string.`,
    type: SettingType.textarea,
  },
  {
    group: LLM_NLU_HELPER_NAMESPACE,
    label: 'trait_classifier_prompt_template',
    value: `You are an advanced text classification assistant. Your task is to classify the given input text provided in the following {{entity.name}} values:

{{#each entity.values}}
- {{value}}
{{/each}}

Provide a concise result by stating only the value of the {{entity.name}}. Return an empty string otherwise.`,
    type: SettingType.textarea,
  },
] as const satisfies HelperSetting<typeof LLM_NLU_HELPER_NAME>[];
