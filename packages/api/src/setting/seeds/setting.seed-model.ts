/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { SettingCreateDto } from '../dto/setting.dto';
import { SettingFieldDefinition } from '../types';

export const chatbotSettingsSchema = z
  .object({
    default_nlu_helper: z.string(),
    default_nlu_penalty_factor: z.number().min(0).max(1),
    default_llm_helper: z.string(),
    default_flow_escape_helper: z.string(),
    default_storage_helper: z.string(),
    global_fallback: z.boolean(),
    fallback_message: z.array(z.string()),
  })
  .strict();

export const ragSettingsSchema = z
  .object({
    enabled: z.boolean(),
    default_mode: z.enum(['embedding', 'lexical']),
    embedding_provider: z.string(),
    embedding_model: z.string(),
    embedding_api_key: z.string(),
    embedding_base_url: z.string(),
    embedding_dimensions: z.number().int().min(1).max(4096),
    top_k: z.number().int().min(1).max(50),
    index_only_active_content: z.boolean(),
  })
  .strict();

export const contactSettingsSchema = z
  .object({
    contact_email_recipient: z.string(),
    company_name: z.string(),
    company_phone: z.string(),
    company_email: z.string(),
    company_address1: z.string(),
    company_address2: z.string(),
    company_city: z.string(),
    company_zipcode: z.string(),
    company_state: z.string(),
    company_country: z.string(),
  })
  .strict();

export type ChatbotSettings = z.infer<typeof chatbotSettingsSchema>;

export type RagSettings = z.infer<typeof ragSettingsSchema>;

export type ContactSettings = z.infer<typeof contactSettingsSchema>;

export const CHATBOT_SETTING_FIELDS = {
  default_nlu_helper: {
    schema: {
      type: 'string',
      default: 'llm-nlu-helper',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'NluHelper',
        valueKey: 'name',
        labelKey: 'name',
        enableEntityAddButton: false,
      },
    },
    weight: 1,
  },
  default_nlu_penalty_factor: {
    schema: {
      type: 'number',
      default: 0.95,
      minimum: 0,
      maximum: 1,
      'ui:options': { step: 0.01 },
    },
    weight: 2,
  },
  default_llm_helper: {
    schema: {
      type: 'string',
      default: 'ollama-helper',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'LlmHelper',
        valueKey: 'name',
        labelKey: 'name',
        enableEntityAddButton: false,
      },
    },
    weight: 3,
  },
  default_flow_escape_helper: {
    schema: {
      type: 'string',
      default: '',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'FlowEscapeHelper',
        valueKey: 'name',
        labelKey: 'name',
        enableEntityAddButton: false,
      },
    },
    weight: 3,
  },
  default_storage_helper: {
    schema: {
      type: 'string',
      default: 'local-storage-helper',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'StorageHelper',
        valueKey: 'name',
        labelKey: 'name',
        enableEntityAddButton: false,
      },
    },
    weight: 4,
  },
  global_fallback: {
    schema: {
      type: 'boolean',
      default: true,
    },
    weight: 5,
  },
  fallback_message: {
    schema: {
      type: 'array',
      items: { type: 'string' },
      default: [
        "Sorry but i didn't understand your request. Maybe you can check the menu",
        "I'm really sorry but i don't quite understand what you are saying :(",
      ],
    },
    weight: 6,
    translatable: true,
  },
} as const satisfies Record<keyof ChatbotSettings, SettingFieldDefinition>;

export const RAG_SETTING_FIELDS = {
  enabled: {
    schema: {
      type: 'boolean',
      default: false,
    },
    weight: 1,
  },
  default_mode: {
    schema: {
      type: 'string',
      default: 'lexical',
      enum: ['embedding', 'lexical'] as const,
    },
    weight: 2,
  },
  embedding_provider: {
    schema: {
      type: 'string',
      default: 'openai',
    },
    weight: 3,
  },
  embedding_model: {
    schema: {
      type: 'string',
      default: 'text-embedding-3-small',
    },
    weight: 4,
  },
  embedding_api_key: {
    schema: {
      type: 'string',
      default: '',
      'ui:widget': 'password',
    },
    weight: 5,
  },
  embedding_base_url: {
    schema: {
      type: 'string',
      default: '',
    },
    weight: 6,
  },
  embedding_dimensions: {
    schema: {
      type: 'integer',
      default: 1536,
      minimum: 1,
      maximum: 4096,
      'ui:options': { step: 1 },
    },
    weight: 7,
  },
  top_k: {
    schema: {
      type: 'integer',
      default: 3,
      minimum: 1,
      maximum: 50,
      'ui:options': { step: 1 },
    },
    weight: 8,
  },
  index_only_active_content: {
    schema: {
      type: 'boolean',
      default: true,
    },
    weight: 9,
  },
} as const satisfies Record<keyof RagSettings, SettingFieldDefinition>;

export const CONTACT_SETTING_FIELDS = {
  contact_email_recipient: {
    schema: {
      type: 'string',
      default: 'admin@example.com',
    },
    weight: 1,
  },
  company_name: {
    schema: {
      type: 'string',
      default: 'Your company name',
    },
    weight: 2,
  },
  company_phone: {
    schema: {
      type: 'string',
      default: '(+999) 9999 9999 999',
    },
    weight: 3,
  },
  company_email: {
    schema: {
      type: 'string',
      default: 'contact[at]mycompany.com',
    },
    weight: 4,
  },
  company_address1: {
    schema: {
      type: 'string',
      default: '71 Pilgrim Avenue',
    },
    weight: 5,
  },
  company_address2: {
    schema: {
      type: 'string',
      default: '',
    },
    weight: 6,
  },
  company_city: {
    schema: {
      type: 'string',
      default: 'Chevy Chase',
    },
    weight: 7,
  },
  company_zipcode: {
    schema: {
      type: 'string',
      default: '85705',
    },
    weight: 8,
  },
  company_state: {
    schema: {
      type: 'string',
      default: 'Orlando',
    },
    weight: 9,
  },
  company_country: {
    schema: {
      type: 'string',
      default: 'US',
    },
    weight: 10,
  },
} as const satisfies Record<keyof ContactSettings, SettingFieldDefinition>;

export const DEFAULT_SETTING_SCHEMAS = {
  chatbot_settings: chatbotSettingsSchema,
  rag_settings: ragSettingsSchema,
  contact: contactSettingsSchema,
} as const;

export const DEFAULT_SETTING_FIELDS = {
  chatbot_settings: CHATBOT_SETTING_FIELDS,
  rag_settings: RAG_SETTING_FIELDS,
  contact: CONTACT_SETTING_FIELDS,
} as const;

const CHATBOT_SETTINGS = Object.entries(CHATBOT_SETTING_FIELDS).map(
  ([label, definition]) => ({
    group: 'chatbot_settings',
    label,
    ...definition,
  }),
) satisfies SettingCreateDto[];
const RAG_SETTINGS = Object.entries(RAG_SETTING_FIELDS).map(
  ([label, definition]) => ({
    group: 'rag_settings',
    label,
    ...definition,
  }),
) satisfies SettingCreateDto[];
const CONTACT_SETTINGS = Object.entries(CONTACT_SETTING_FIELDS).map(
  ([label, definition]) => ({
    group: 'contact',
    label,
    ...definition,
  }),
) satisfies SettingCreateDto[];

export const DEFAULT_SETTINGS = [
  ...CHATBOT_SETTINGS,
  ...RAG_SETTINGS,
  ...CONTACT_SETTINGS,
] satisfies SettingCreateDto[];
