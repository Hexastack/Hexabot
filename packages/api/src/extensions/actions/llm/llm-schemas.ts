/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValueSchema } from '@hexabot-ai/agentic';
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

const llmPromptBaseSchema = z.object({
  prompt: z.string().min(1).default('=$input.text').optional().meta({
    title: 'Prompt',
    description:
      'Prompt text to send directly to the model instead of loading message history.',
  }),
  messages_limit: z.int().nonnegative().default(0).optional().meta({
    title: 'Messages limit',
    description:
      'Number of most recent conversation messages to include instead of a prompt.',
  }),
  system: z.string().default('You are a helpful assistant.').optional().meta({
    title: 'System',
    description:
      'Optional system instruction prepended to the prompt or message history.',
  }),
});
const validatePromptSource = (
  value: z.infer<typeof llmPromptBaseSchema>,
  ctx: z.RefinementCtx,
) => {
  const promptCount =
    (value.prompt ? 1 : 0) +
    (value.messages_limit !== undefined && value.messages_limit > 0 ? 1 : 0);

  if (promptCount !== 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'Provide exactly one of "prompt" or "messages_limit"',
      path: ['prompt'],
    });
  }
};

export const llmPromptSchema =
  llmPromptBaseSchema.superRefine(validatePromptSource);

export const llmUsageSchema = z.object({
  input_tokens: z.int().nonnegative().optional(),
  output_tokens: z.int().nonnegative().optional(),
  total_tokens: z.int().nonnegative().optional(),
  reasoning_tokens: z.int().nonnegative().optional(),
  cached_input_tokens: z.int().nonnegative().optional(),
  input_token_details: z
    .object({
      no_cache_tokens: z.int().nonnegative().optional(),
      cache_read_tokens: z.int().nonnegative().optional(),
      cache_write_tokens: z.int().nonnegative().optional(),
    })
    .optional(),
  output_token_details: z
    .object({
      text_tokens: z.int().nonnegative().optional(),
      reasoning_tokens: z.int().nonnegative().optional(),
    })
    .optional(),
  raw: z.record(z.string(), z.any()).optional(),
});

export const llmRawResponseSchema = z.object({
  request: z.any().optional(),
  response: z.any().optional(),
  provider_metadata: z.any().optional(),
  warnings: z.array(z.any()).optional(),
});

export const llmCommonSettingsSchema = z.strictObject({
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
  base_url: z.url().optional().meta({
    title: 'Base URL',
    description: 'Custom provider base URL (self-hosted or proxy).',
  }),
  organization: z.string().optional().meta({
    title: 'Organization',
    description: 'Provider organization or account identifier.',
  }),
  tools: z.array(z.string().min(1)).optional().meta({
    title: 'Tools',
    description: 'Allowed tool names or tool IDs for the model.',
  }),
  memory_enabled: z.boolean().optional().meta({
    title: 'Memory enabled',
    description: 'Enable memory feature.',
  }),
  temperature: z.number().min(0).max(2).optional().meta({
    title: 'Temperature',
    description: 'Sampling temperature; higher values increase randomness.',
  }),
  top_p: z.number().min(0).max(1).optional().meta({
    title: 'Top P',
    description: 'Nucleus sampling probability mass to consider.',
  }),
  top_k: z.int().positive().optional().meta({
    title: 'Top K',
    description: 'Limit sampling to the top K most likely tokens.',
  }),
  max_output_tokens: z.int().positive().optional().meta({
    title: 'Max output tokens',
    description: 'Maximum number of tokens to generate in the output.',
  }),
  presence_penalty: z.number().min(-2).max(2).optional().meta({
    title: 'Presence penalty',
    description: 'Penalty for introducing new topics or tokens.',
  }),
  frequency_penalty: z.number().min(-2).max(2).optional().meta({
    title: 'Frequency penalty',
    description: 'Penalty for repeating tokens frequently.',
  }),
  stop_sequences: z.array(z.string().min(1)).optional().meta({
    title: 'Stop sequences',
    description: 'Sequences that will stop generation when encountered.',
  }),
  seed: z.int().optional().meta({
    title: 'Seed',
    description: 'Seed for deterministic sampling when supported.',
  }),
  stop_step_count: z.int().positive().optional().meta({
    title: 'Stop step count',
    description: 'Maximum number of agent steps before stopping.',
  }),
  stop_tool_call: z.string().trim().min(1).optional().meta({
    title: 'Stop tool call',
    description: 'Stop when the specified tool call is triggered.',
  }),
});

export const jsonSchemaInput = z.record(z.string(), JsonValueSchema);

export const llmGenerateTextInputSchema = llmPromptSchema;

export const llmGenerateTextOutputSchema = z.object({
  text: z.string(),
  object: z.any().optional(),
  reasoning: z.string().optional(),
  finish_reason: z.string().optional(),
  model: z.string().optional(),
  usage: llmUsageSchema.optional(),
  raw: llmRawResponseSchema.optional(),
});

export const llmGenerateTextSettingsSchema = llmCommonSettingsSchema.extend({
  output_schema: jsonSchemaInput.optional().meta({
    title: 'Output schema',
    description:
      'Optional JSON Schema used to request structured output from the model.',
    'ui:field': 'JsonSchemaObjectField',
  }),
});

export const llmAgentInputSchema =
  llmPromptBaseSchema.superRefine(validatePromptSource);

export const llmAgentOutputSchema = z.object({
  text: z.string().optional(),
  content: z.array(z.any()).optional(),
  reasoning: z.string().optional(),
  files: z.array(z.any()).optional(),
  sources: z.array(z.any()).optional(),
  tool_calls: z.array(z.any()).optional(),
  tool_results: z.array(z.any()).optional(),
  finish_reason: z.string().optional(),
  raw_finish_reason: z.string().optional(),
  model: z.string().optional(),
  usage: llmUsageSchema.optional(),
  total_usage: llmUsageSchema.optional(),
  steps: z.array(z.any()).optional(),
  raw: llmRawResponseSchema.optional(),
});

export const llmAgentSettingsSchema = llmCommonSettingsSchema;

export type LlmPromptInput = z.infer<typeof llmPromptSchema>;

export type LlmCommonSettings = z.infer<typeof llmCommonSettingsSchema>;

export type LlmGenerateTextInput = z.infer<typeof llmGenerateTextInputSchema>;

export type LlmGenerateTextOutput = z.infer<typeof llmGenerateTextOutputSchema>;

export type LlmGenerateTextSettings = z.infer<
  typeof llmGenerateTextSettingsSchema
>;

export type LlmAgentInput = z.infer<typeof llmAgentInputSchema>;

export type LlmAgentOutput = z.infer<typeof llmAgentOutputSchema>;

export type LlmAgentSettings = z.infer<typeof llmAgentSettingsSchema>;
