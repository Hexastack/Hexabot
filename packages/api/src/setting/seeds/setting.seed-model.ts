/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingCreateDto } from '../dto/setting.dto';
import {
  createCheckboxSettingSchema,
  createMultipleTextSettingSchema,
  createNumberSettingSchema,
  createSecretSettingSchema,
  createSelectSettingSchema,
  createTextSettingSchema,
} from '../utils/setting-schema-definition.utils';

export const DEFAULT_SETTINGS = [
  {
    group: 'chatbot_settings',
    label: 'default_nlu_helper',
    schema: createSelectSettingSchema({
      defaultValue: 'llm-nlu-helper',
      entity: 'NluHelper',
    }),
    weight: 1,
  },
  {
    group: 'chatbot_settings',
    label: 'default_nlu_penalty_factor',
    schema: createNumberSettingSchema({
      defaultValue: 0.95,
      min: 0,
      max: 1,
      step: 0.01,
    }),
    weight: 2,
  },
  {
    group: 'chatbot_settings',
    label: 'default_llm_helper',
    schema: createSelectSettingSchema({
      defaultValue: 'ollama-helper',
      entity: 'LlmHelper',
    }),
    weight: 3,
  },
  {
    group: 'chatbot_settings',
    label: 'default_flow_escape_helper',
    schema: createSelectSettingSchema({
      defaultValue: '',
      entity: 'FlowEscapeHelper',
    }),
    weight: 3,
  },
  {
    group: 'chatbot_settings',
    label: 'default_storage_helper',
    schema: createSelectSettingSchema({
      defaultValue: 'local-storage-helper',
      entity: 'StorageHelper',
    }),
    weight: 4,
  },
  {
    group: 'chatbot_settings',
    label: 'global_fallback',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
    weight: 5,
  },
  {
    group: 'chatbot_settings',
    label: 'fallback_message',
    schema: createMultipleTextSettingSchema({
      defaultValue: [
        "Sorry but i didn't understand your request. Maybe you can check the menu",
        "I'm really sorry but i don't quite understand what you are saying :(",
      ],
    }),
    weight: 6,
    translatable: true,
  },
  {
    group: 'rag_settings',
    label: 'enabled',
    schema: createCheckboxSettingSchema({ defaultValue: false }),
    weight: 1,
  },
  {
    group: 'rag_settings',
    label: 'default_mode',
    schema: createSelectSettingSchema({
      defaultValue: 'lexical',
      options: ['embedding', 'lexical'] as const,
    }),
    weight: 2,
  },
  {
    group: 'rag_settings',
    label: 'embedding_provider',
    schema: createTextSettingSchema({ defaultValue: 'openai' }),
    weight: 3,
  },
  {
    group: 'rag_settings',
    label: 'embedding_model',
    schema: createTextSettingSchema({ defaultValue: 'text-embedding-3-small' }),
    weight: 4,
  },
  {
    group: 'rag_settings',
    label: 'embedding_api_key',
    schema: createSecretSettingSchema({ defaultValue: '' }),
    weight: 5,
  },
  {
    group: 'rag_settings',
    label: 'embedding_base_url',
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 6,
  },
  {
    group: 'rag_settings',
    label: 'embedding_dimensions',
    schema: createNumberSettingSchema({
      defaultValue: 1536,
      min: 1,
      max: 4096,
      step: 1,
      integer: true,
    }),
    weight: 7,
  },
  {
    group: 'rag_settings',
    label: 'top_k',
    schema: createNumberSettingSchema({
      defaultValue: 3,
      min: 1,
      max: 50,
      step: 1,
      integer: true,
    }),
    weight: 8,
  },
  {
    group: 'rag_settings',
    label: 'index_only_active_content',
    schema: createCheckboxSettingSchema({ defaultValue: true }),
    weight: 9,
  },
  {
    group: 'contact',
    label: 'contact_email_recipient',
    schema: createTextSettingSchema({ defaultValue: 'admin@example.com' }),
    weight: 1,
  },
  {
    group: 'contact',
    label: 'company_name',
    schema: createTextSettingSchema({ defaultValue: 'Your company name' }),
    weight: 2,
  },
  {
    group: 'contact',
    label: 'company_phone',
    schema: createTextSettingSchema({ defaultValue: '(+999) 9999 9999 999' }),
    weight: 3,
  },
  {
    group: 'contact',
    label: 'company_email',
    schema: createTextSettingSchema({
      defaultValue: 'contact[at]mycompany.com',
    }),
    weight: 4,
  },
  {
    group: 'contact',
    label: 'company_address1',
    schema: createTextSettingSchema({ defaultValue: '71 Pilgrim Avenue' }),
    weight: 5,
  },
  {
    group: 'contact',
    label: 'company_address2',
    schema: createTextSettingSchema({ defaultValue: '' }),
    weight: 6,
  },
  {
    group: 'contact',
    label: 'company_city',
    schema: createTextSettingSchema({ defaultValue: 'Chevy Chase' }),
    weight: 7,
  },
  {
    group: 'contact',
    label: 'company_zipcode',
    schema: createTextSettingSchema({ defaultValue: '85705' }),
    weight: 8,
  },
  {
    group: 'contact',
    label: 'company_state',
    schema: createTextSettingSchema({ defaultValue: 'Orlando' }),
    weight: 9,
  },
  {
    group: 'contact',
    label: 'company_country',
    schema: createTextSettingSchema({ defaultValue: 'US' }),
    weight: 10,
  },
] as const satisfies SettingCreateDto[];
