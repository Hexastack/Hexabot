/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

export const vercelAiSdkProviders = [
  'alibaba',
  'amazon-bedrock',
  'anthropic',
  'assemblyai',
  'azure',
  'baseten',
  'black-forest-labs',
  'bytedance',
  'cerebras',
  'claude',
  'cohere',
  'deepgram',
  'deepinfra',
  'deepseek',
  'elevenlabs',
  'fal',
  'fireworks',
  'gateway',
  'gemini',
  'gladia',
  'google',
  'google-vertex',
  'groq',
  'huggingface',
  'hume',
  'klingai',
  'lmnt',
  'luma',
  'mistral',
  'moonshotai',
  'open-responses',
  'openai',
  'openai-compatible',
  'perplexity',
  'prodia',
  'replicate',
  'revai',
  'togetherai',
  'vercel',
  'xai',
] as const;

export const aiModelBindingSchema = z.strictObject({
  provider: z.enum(vercelAiSdkProviders).default('openai').meta({
    title: 'Provider',
    description:
      'Vercel AI SDK provider identifier. Selecting a provider still requires its package to be installed (e.g., @ai-sdk/anthropic, @ai-sdk/google). By default, package.json only includes OpenAI/Gateway provider packages.',
  }),
  model: z.string().min(1).default('gpt-5.2').meta({
    title: 'Model',
    description: 'Provider model identifier to use for generation.',
  }),
  api_key: z
    .string()
    .optional()
    .meta({
      title: 'Credential',
      description: 'Provider API key override for this action.',
      'ui:widget': 'AutoCompleteWidget',
      'ui:options': {
        entity: 'Credential',
        valueKey: 'id',
        labelKey: 'name',
      },
    }),
  base_url: z
    .url()
    .optional()
    .meta({
      title: 'Base URL',
      description: 'Custom provider base URL (self-hosted or proxy).',
      'ui:options': {
        showWhen: {
          field: 'provider',
          equals: 'gateway',
        },
      },
    }),
  organization: z
    .string()
    .optional()
    .meta({
      title: 'Organization',
      description: 'Provider organization or account identifier.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
});

export const aiToolBindingSchema = z.strictObject({
  action: z.string().min(1),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const bindingKinds = {
  tools: {
    schema: aiToolBindingSchema,
    multiple: true,
  },
  model: {
    schema: aiModelBindingSchema,
    multiple: false,
  },
} as const;

export type RuntimeBindingKind = keyof typeof bindingKinds;

export type RuntimeBindingPayload<K extends RuntimeBindingKind> = z.infer<
  (typeof bindingKinds)[K]['schema']
>;

export type RuntimeToolBinding = RuntimeBindingPayload<'tools'>;

export type RuntimeModelBinding = RuntimeBindingPayload<'model'>;

export type RuntimeBindings = Partial<{
  [K in RuntimeBindingKind]: Record<string, RuntimeBindingPayload<K>>;
}>;
