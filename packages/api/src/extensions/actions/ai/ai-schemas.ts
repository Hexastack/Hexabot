/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValueSchema } from '@hexabot-ai/agentic';
import { z } from 'zod';

export const DEFAULT_AI_PROMPT = '=$input.text';

export const DEFAULT_AI_MESSAGES_LIMIT = 4;

const aiPromptBaseSchema = z.object({
  input_mode: z
    .enum(['prompt', 'history'])
    .default('prompt')
    .meta({
      title: 'Input mode',
      description:
        'Choose whether to send a direct prompt or use recent conversation history.',
      'ui:widget': 'radio',
      'ui:options': {
        inline: true,
      },
    }),
  prompt: z
    .string()
    .min(1)
    .default(DEFAULT_AI_PROMPT)
    .optional()
    .meta({
      title: 'Prompt',
      description:
        'Prompt text to send directly to the model instead of loading message history.',
      'ui:options': {
        showWhen: {
          field: 'input_mode',
          equals: 'prompt',
        },
      },
    }),
  messages_limit: z
    .int()
    .positive()
    .default(DEFAULT_AI_MESSAGES_LIMIT)
    .optional()
    .meta({
      title: 'Messages limit',
      description:
        'Number of most recent conversation messages to include instead of a prompt.',
      'ui:options': {
        showWhen: {
          field: 'input_mode',
          equals: 'history',
        },
      },
    }),
  system: z.string().default('You are a helpful assistant.').optional().meta({
    title: 'System',
    description:
      'Optional system instruction prepended to the prompt or message history.',
  }),
});
const aiPromptOnlySchema = z.strictObject({
  prompt: z.string().min(1).default(DEFAULT_AI_PROMPT).optional().meta({
    title: 'Prompt',
    description: 'Prompt text to send directly to the model.',
  }),
  system: z.string().default('You are a helpful assistant.').optional().meta({
    title: 'System',
    description: 'Optional system instruction prepended to the prompt.',
  }),
});

export const aiPromptSchema = aiPromptBaseSchema;

export const aiUsageSchema = z.object({
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

export const aiRawResponseSchema = z.object({
  request: z.any().optional(),
  response: z.any().optional(),
  provider_metadata: z.any().optional(),
  warnings: z.array(z.any()).optional(),
});

export const aiCommonSettingsSchema = z.strictObject({
  memory_enabled: z.boolean().optional().meta({
    title: 'Memory enabled',
    description: 'Enable memory feature.',
  }),
  temperature: z.number().min(0).max(2).optional().meta({
    title: 'Temperature',
    description: 'Sampling temperature; higher values increase randomness.',
  }),
  max_output_tokens: z.int().positive().optional().meta({
    title: 'Max output tokens',
    description: 'Maximum number of tokens to generate in the output.',
  }),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .meta({
      title: 'Top P',
      description: 'Nucleus sampling probability mass to consider.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  top_k: z
    .int()
    .positive()
    .optional()
    .meta({
      title: 'Top K',
      description: 'Limit sampling to the top K most likely tokens.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  presence_penalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .meta({
      title: 'Presence penalty',
      description: 'Penalty for introducing new topics or tokens.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  frequency_penalty: z
    .number()
    .min(-2)
    .max(2)
    .optional()
    .meta({
      title: 'Frequency penalty',
      description: 'Penalty for repeating tokens frequently.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  stop_sequences: z
    .array(z.string().min(1))
    .optional()
    .meta({
      title: 'Stop sequences',
      description: 'Sequences that will stop generation when encountered.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  seed: z
    .int()
    .optional()
    .meta({
      title: 'Seed',
      description: 'Seed for deterministic sampling when supported.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  stop_step_count: z
    .int()
    .positive()
    .optional()
    .meta({
      title: 'Stop step count',
      description: 'Maximum number of agent steps before stopping.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
  stop_tool_call: z
    .string()
    .trim()
    .min(1)
    .optional()
    .meta({
      title: 'Stop tool call',
      description: 'Stop when the specified tool call is triggered.',
      'ui:options': {
        hideUntilAdded: true,
      },
    }),
});

export const jsonSchemaInput = z.record(z.string(), JsonValueSchema);

export const aiGenerateReplyInputSchema = aiPromptSchema;

export const aiGenerateTextInputSchema = aiPromptOnlySchema;

const aiTextOutputSchema = z.object({
  text: z.string(),
  reasoning: z.string().optional(),
  finish_reason: z.string().optional(),
  model: z.string().optional(),
  usage: aiUsageSchema.optional(),
  raw: aiRawResponseSchema.optional(),
});
const aiObjectOutputSchema = aiTextOutputSchema.extend({
  object: z.any(),
});
const aiObjectSettingsSchema = aiCommonSettingsSchema.extend({
  output_schema: jsonSchemaInput.meta({
    title: 'Output schema',
    description:
      'JSON Schema used to request structured output from the model.',
    'ui:field': 'JsonSchemaObjectField',
  }),
});

export const aiGenerateTextOutputSchema = aiTextOutputSchema;

export const aiGenerateTextSettingsSchema = aiCommonSettingsSchema;

export const aiGenerateReplyOutputSchema = aiGenerateTextOutputSchema;

export const aiGenerateReplySettingsSchema = aiCommonSettingsSchema;

export const aiGenerateObjectInputSchema = aiPromptOnlySchema;

export const aiGenerateObjectOutputSchema = aiObjectOutputSchema;

export const aiGenerateObjectSettingsSchema = aiObjectSettingsSchema;

export const aiInferObjectInputSchema = aiPromptSchema;

export const aiInferObjectOutputSchema = aiObjectOutputSchema;

export const aiInferObjectSettingsSchema = aiObjectSettingsSchema;

export const aiAgentInputSchema = aiPromptSchema;

export const aiAgentOutputSchema = z.object({
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
  usage: aiUsageSchema.optional(),
  total_usage: aiUsageSchema.optional(),
  steps: z.array(z.any()).optional(),
  raw: aiRawResponseSchema.optional(),
});

export const aiAgentSettingsSchema = aiCommonSettingsSchema;

export type AiPromptInput = z.infer<typeof aiPromptSchema>;

export type AiCommonSettings = z.infer<typeof aiCommonSettingsSchema>;

export type AiGenerateTextInput = z.infer<typeof aiGenerateTextInputSchema>;

export type AiGenerateTextOutput = z.infer<typeof aiGenerateTextOutputSchema>;

export type AiGenerateTextSettings = z.infer<
  typeof aiGenerateTextSettingsSchema
>;

export type AiGenerateReplyInput = z.infer<typeof aiGenerateReplyInputSchema>;

export type AiGenerateReplyOutput = z.infer<typeof aiGenerateReplyOutputSchema>;

export type AiGenerateReplySettings = z.infer<
  typeof aiGenerateReplySettingsSchema
>;

export type AiGenerateObjectInput = z.infer<typeof aiGenerateObjectInputSchema>;

export type AiGenerateObjectOutput = z.infer<
  typeof aiGenerateObjectOutputSchema
>;

export type AiGenerateObjectSettings = z.infer<
  typeof aiGenerateObjectSettingsSchema
>;

export type AiInferObjectInput = z.infer<typeof aiInferObjectInputSchema>;

export type AiInferObjectOutput = z.infer<typeof aiInferObjectOutputSchema>;

export type AiInferObjectSettings = z.infer<typeof aiInferObjectSettingsSchema>;

export type AiAgentInput = z.infer<typeof aiAgentInputSchema>;

export type AiAgentOutput = z.infer<typeof aiAgentOutputSchema>;

export type AiAgentSettings = z.infer<typeof aiAgentSettingsSchema>;
