/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Settings, SettingsSchema } from '@hexabot-ai/agentic';
import { JSONSchema7 } from 'json-schema';
import { z } from 'zod';

const llmPromptBaseSchema = z.object({
  prompt: z.string().min(1).optional(),
  messages_limit: z.number().int().positive().optional(),
  system: z.string().optional(),
});
const validatePromptSource = (
  value: z.infer<typeof llmPromptBaseSchema>,
  ctx: z.RefinementCtx,
) => {
  const promptCount =
    (value.prompt ? 1 : 0) + (value.messages_limit !== undefined ? 1 : 0);

  if (promptCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide exactly one of "prompt" or "messages_limit"',
      path: ['prompt'],
    });
  }
};

export const llmPromptSchema =
  llmPromptBaseSchema.superRefine(validatePromptSource);

export const llmUsageSchema = z.object({
  input_tokens: z.number().int().nonnegative().optional(),
  output_tokens: z.number().int().nonnegative().optional(),
  total_tokens: z.number().int().nonnegative().optional(),
  reasoning_tokens: z.number().int().nonnegative().optional(),
  cached_input_tokens: z.number().int().nonnegative().optional(),
});

export const llmRawResponseSchema = z.object({
  request: z.any().optional(),
  response: z.any().optional(),
  provider_metadata: z.any().optional(),
  warnings: z.array(z.any()).optional(),
});

export const llmCommonSettingsSchema = SettingsSchema.extend({
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().int().positive().optional(),
  max_output_tokens: z.number().int().positive().optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  stop_sequences: z.array(z.string().min(1)).min(1).optional(),
  seed: z.number().int().optional(),
  provider: z.string().default('openai'),
  api_key: z.string().optional(),
  base_url: z.string().url().optional(),
  organization: z.string().optional(),
});

export const llmGenerateTextInputSchema = llmPromptSchema;

export const llmGenerateTextOutputSchema = z.object({
  text: z.string(),
  finish_reason: z.string().optional(),
  model: z.string().optional(),
  usage: llmUsageSchema.optional(),
  raw: llmRawResponseSchema.optional(),
});

export const llmGenerateTextSettingsSchema = llmCommonSettingsSchema;

export const jsonSchemaInput = z.custom<JSONSchema7>(
  (value) =>
    value !== undefined &&
    value !== null &&
    (typeof value === 'boolean' || typeof value === 'object'),
  { message: 'schema must be a valid JSON Schema object or boolean' },
);

export const llmGenerateObjectInputSchema = llmPromptBaseSchema
  .extend({
    schema: jsonSchemaInput,
    schema_name: z.string().min(1).optional(),
    schema_description: z.string().min(1).optional(),
  })
  .superRefine(validatePromptSource);

export const llmGenerateObjectOutputSchema = z.object({
  object: z.any(),
  reasoning: z.string().optional(),
  finish_reason: z.string().optional(),
  model: z.string().optional(),
  usage: llmUsageSchema.optional(),
  raw: llmRawResponseSchema.optional(),
});

export const llmGenerateObjectSettingsSchema = llmCommonSettingsSchema;

export type LlmPromptInput = z.infer<typeof llmPromptSchema>;

export type LlmCommonSettings = Settings &
  z.infer<typeof llmCommonSettingsSchema>;

export type LlmGenerateTextInput = z.infer<typeof llmGenerateTextInputSchema>;

export type LlmGenerateTextOutput = z.infer<typeof llmGenerateTextOutputSchema>;

export type LlmGenerateTextSettings = z.infer<
  typeof llmGenerateTextSettingsSchema
>;

export type LlmGenerateObjectInput = z.infer<
  typeof llmGenerateObjectInputSchema
>;

export type LlmGenerateObjectOutput = z.infer<
  typeof llmGenerateObjectOutputSchema
>;

export type LlmGenerateObjectSettings = z.infer<
  typeof llmGenerateObjectSettingsSchema
>;
