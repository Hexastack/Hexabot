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
  input_token_details: z
    .object({
      no_cache_tokens: z.number().int().nonnegative().optional(),
      cache_read_tokens: z.number().int().nonnegative().optional(),
      cache_write_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
  output_token_details: z
    .object({
      text_tokens: z.number().int().nonnegative().optional(),
      reasoning_tokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
  raw: z.record(z.any()).optional(),
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
  tools: z.array(z.string().min(1)).optional(),
  memory_enabled: z.boolean().optional(),
  stop_step_count: z.number().int().positive().optional(),
  stop_tool_call: z.string().trim().min(1).optional(),
});

export const jsonSchemaInput = z.custom<JSONSchema7>(
  (value) =>
    value !== undefined &&
    value !== null &&
    (typeof value === 'boolean' || typeof value === 'object'),
  { message: 'schema must be a valid JSON Schema object or boolean' },
);

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

export const llmGenerateTextSettingsSchema = llmCommonSettingsSchema
  .extend({
    output_schema: jsonSchemaInput.optional(),
    output_schema_name: z.string().min(1).optional(),
    output_schema_description: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.output_schema_name || value.output_schema_description) &&
      !value.output_schema
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide "output_schema" to use output schema metadata.',
        path: ['output_schema'],
      });
    }
  });

export const llmAgentInputSchema = llmPromptBaseSchema
  .extend({
    instructions: z.string().min(1).optional(),
  })
  .superRefine(validatePromptSource);

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

export const llmAgentSettingsSchema = llmCommonSettingsSchema.extend({
  instructions: z.string().min(1).optional(),
});

export type LlmPromptInput = z.infer<typeof llmPromptSchema>;

export type LlmCommonSettings = Settings &
  z.infer<typeof llmCommonSettingsSchema>;

export type LlmGenerateTextInput = z.infer<typeof llmGenerateTextInputSchema>;

export type LlmGenerateTextOutput = z.infer<typeof llmGenerateTextOutputSchema>;

export type LlmGenerateTextSettings = z.infer<
  typeof llmGenerateTextSettingsSchema
>;

export type LlmAgentInput = z.infer<typeof llmAgentInputSchema>;

export type LlmAgentOutput = z.infer<typeof llmAgentOutputSchema>;

export type LlmAgentSettings = z.infer<typeof llmAgentSettingsSchema>;
