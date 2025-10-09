/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
