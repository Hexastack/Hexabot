/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import z from 'zod';

import { createSettingGroup } from '@/setting/create-setting-group';
import { RuntimeSettingGroupSchema } from '@/setting/runtime-settings';

export const CHATBOT_SETTINGS_GROUP = 'chatbot_settings' as const;

export const RAG_SETTINGS_GROUP = 'rag_settings' as const;

export const CONTACT_SETTINGS_GROUP = 'contact' as const;

export const chatbotSettingsSchema = z
  .strictObject({
    license_key: z.string().default('').meta({
      title: 'License key',
      description:
        'Provide the license key associated with your subscription. Learn more about available plans at https://hexabot.ai/pricing#pricing.',
      'ui:widget': 'password',
    }),
    default_nlu_helper: z
      .string()
      .default('llm-nlu')
      .meta({
        title: 'Default NLU helper',
        description: 'Helper used by default to run NLU tasks.',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          entity: 'NluHelper',
          valueKey: 'name',
          labelKey: 'name',
        },
      }),
    default_nlu_penalty_factor: z
      .number()
      .min(0)
      .max(1)
      .multipleOf(0.01)
      .default(0.95)
      .meta({
        title: 'Default NLU penalty factor',
        description: 'Penalty factor applied to NLU confidence scoring.',
        'ui:options': {
          step: 0.01,
        },
      }),
    default_llm_helper: z
      .string()
      .default('ollama')
      .meta({
        title: 'Default LLM helper',
        description: 'Helper used by default for LLM generation tasks.',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          entity: 'LlmHelper',
          valueKey: 'name',
          labelKey: 'name',
        },
      }),
    default_storage_helper: z
      .string()
      .default('local-storage')
      .meta({
        title: 'Default storage helper',
        description: 'Helper used to persist chatbot data by default.',
        'ui:widget': 'AutoCompleteWidget',
        'ui:options': {
          entity: 'StorageHelper',
          valueKey: 'name',
          labelKey: 'name',
        },
      }),
    global_fallback: z.boolean().default(true).meta({
      title: 'Enable global fallback',
      description: 'Enable fallback handling when no intent or flow matches.',
    }),
    fallback_message: z
      .array(z.string())
      .default([
        "Sorry but i didn't understand your request. Maybe you can check the menu",
        "I'm really sorry but i don't quite understand what you are saying :(",
      ])
      .meta({
        title: 'Fallback messages',
        description: 'Messages shown when fallback handling is triggered.',
      }),
  })
  .meta({
    title: 'Chatbot',
  });

export const ragSettingsSchema = z
  .strictObject({
    enabled: z.boolean().default(false).meta({
      title: 'Enable RAG',
      description: 'Enable retrieval-augmented generation.',
    }),
    default_mode: z.enum(['embedding', 'lexical']).default('lexical').meta({
      title: 'Default RAG mode',
      description: 'Default retrieval mode used for RAG queries.',
      'ui:widget': 'select',
    }),
    embedding_provider: z.string().default('openai').meta({
      title: 'Embedding provider',
      description: 'Provider used to generate embedding vectors.',
    }),
    embedding_model: z.string().default('text-embedding-3-small').meta({
      title: 'Embedding model',
      description: 'Embedding model identifier used by the selected provider.',
    }),
    embedding_api_key: z.string().default('').meta({
      title: 'Embedding API key',
      description: 'API key used by the configured embedding provider.',
      'ui:widget': 'password',
    }),
    embedding_base_url: z.url().default('').meta({
      title: 'Embedding base URL',
      description: 'Custom base URL used for embedding API requests.',
    }),
    embedding_dimensions: z
      .number()
      .int()
      .min(1)
      .max(4096)
      .default(1536)
      .meta({
        title: 'Embedding dimensions',
        description: 'Number of dimensions expected for embedding vectors.',
        'ui:options': {
          step: 1,
        },
      }),
    top_k: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(3)
      .meta({
        title: 'Top K results',
        description: 'Maximum number of retrieved chunks returned per query.',
        'ui:options': {
          step: 1,
        },
      }),
    index_only_active_content: z.boolean().default(true).meta({
      title: 'Index only active content',
      description:
        'Include only active content entries in the retrieval index.',
    }),
  })
  .meta({
    title: 'RAG',
  });

export const contactSettingsSchema = z
  .strictObject({
    contact_email_recipient: z.string().default('admin@example.com').meta({
      title: 'Contact recipient email',
      description: 'Email address that receives contact form submissions.',
    }),
    company_name: z.string().default('Your company name').meta({
      title: 'Company name',
      description: 'Company name displayed to end users.',
    }),
    company_phone: z.string().default('(+999) 9999 9999 999').meta({
      title: 'Company phone',
      description: 'Primary phone number displayed in contact information.',
    }),
    company_email: z.string().default('contact[at]mycompany.com').meta({
      title: 'Company email',
      description: 'Public contact email address shown to users.',
    }),
    company_address1: z.string().default('71 Pilgrim Avenue').meta({
      title: 'Address line 1',
      description: 'First line of the company postal address.',
    }),
    company_address2: z.string().default('').meta({
      title: 'Address line 2',
      description: 'Second line of the company postal address.',
    }),
    company_city: z.string().default('Chevy Chase').meta({
      title: 'City',
      description: 'City for the company postal address.',
    }),
    company_zipcode: z.string().default('85705').meta({
      title: 'Postal code',
      description: 'Postal or ZIP code for the company address.',
    }),
    company_state: z.string().default('Orlando').meta({
      title: 'State or region',
      description: 'State, region, or province for the company address.',
    }),
    company_country: z.string().default('US').meta({
      title: 'Country',
      description: 'Country code for the company address.',
    }),
  })
  .meta({
    title: 'Contact',
  });

declare global {
  interface RuntimeSettingRegistry {
    [CHATBOT_SETTINGS_GROUP]: typeof chatbotSettingsSchema;
    [RAG_SETTINGS_GROUP]: typeof ragSettingsSchema;
    [CONTACT_SETTINGS_GROUP]: typeof contactSettingsSchema;
  }
}

export const ChatbotSettingsGroup = createSettingGroup({
  group: CHATBOT_SETTINGS_GROUP,
  schema: chatbotSettingsSchema,
  scope: 'global',
});

export const RagSettingsGroup = createSettingGroup({
  group: RAG_SETTINGS_GROUP,
  schema: ragSettingsSchema,
  scope: 'global',
});

export const ContactSettingsGroup = createSettingGroup({
  group: CONTACT_SETTINGS_GROUP,
  schema: contactSettingsSchema,
  scope: 'global',
});

export const DEFAULT_GLOBAL_SETTING_SCHEMAS = [
  {
    group: CHATBOT_SETTINGS_GROUP,
    schema: chatbotSettingsSchema,
  },
  {
    group: RAG_SETTINGS_GROUP,
    schema: ragSettingsSchema,
  },
  {
    group: CONTACT_SETTINGS_GROUP,
    schema: contactSettingsSchema,
  },
] as const satisfies {
  group: string;
  schema: RuntimeSettingGroupSchema;
}[];
