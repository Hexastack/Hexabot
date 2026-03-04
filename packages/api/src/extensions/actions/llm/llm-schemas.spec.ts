/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DEFAULT_LLM_MESSAGES_LIMIT,
  DEFAULT_LLM_PROMPT,
  llmAgentInputSchema,
  llmGenerateObjectSettingsSchema,
  llmGenerateReplyInputSchema,
  llmGenerateReplySettingsSchema,
  llmGenerateTextInputSchema,
  llmGenerateTextSettingsSchema,
  llmInferObjectInputSchema,
  llmInferObjectSettingsSchema,
  llmPromptSchema,
} from './llm-schemas';

describe('llm prompt schemas', () => {
  it('accepts prompt mode with prompt text', () => {
    const result = llmPromptSchema.safeParse({
      input_mode: 'prompt',
      prompt: 'Tell me a joke',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('accepts history mode with a positive messages limit', () => {
    const result = llmPromptSchema.safeParse({
      input_mode: 'history',
      messages_limit: 5,
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('defaults prompt mode prompt to workflow input text', () => {
    const result = llmPromptSchema.safeParse({
      input_mode: 'prompt',
    });

    expect(result.success).toBe(true);
    expect(result.data?.prompt).toBe(DEFAULT_LLM_PROMPT);
  });

  it('defaults missing input mode to prompt', () => {
    const result = llmPromptSchema.safeParse({
      prompt: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.data?.input_mode).toBe('prompt');
  });

  it('defaults history mode messages_limit to 4 when missing', () => {
    const result = llmPromptSchema.safeParse({
      input_mode: 'history',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
    expect(result.data?.messages_limit).toBe(DEFAULT_LLM_MESSAGES_LIMIT);
  });

  it('rejects prompt mode with conflicting messages_limit', () => {
    const result = llmPromptSchema.safeParse({
      input_mode: 'prompt',
      prompt: 'Tell me a joke',
      messages_limit: 2,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ['messages_limit'],
        message:
          '"messages_limit" is not allowed when "input_mode" is "prompt".',
      }),
    );
  });

  it('keeps llm_generate_reply and llm_agent input schemas aligned', () => {
    const promptInput = {
      input_mode: 'prompt',
    };
    const historyInput = {
      input_mode: 'history',
    };

    expect(llmGenerateReplyInputSchema.safeParse(promptInput).success).toBe(
      true,
    );
    expect(llmAgentInputSchema.safeParse(historyInput).success).toBe(true);
    expect(llmGenerateReplyInputSchema.parse(promptInput).prompt).toBe(
      DEFAULT_LLM_PROMPT,
    );
    expect(llmAgentInputSchema.parse(historyInput).messages_limit).toBe(
      DEFAULT_LLM_MESSAGES_LIMIT,
    );
  });

  it('keeps llm_infer_object and llm_agent input schemas aligned', () => {
    const historyInput = {
      input_mode: 'history',
    };

    expect(llmInferObjectInputSchema.safeParse(historyInput).success).toBe(
      true,
    );
    expect(llmAgentInputSchema.safeParse(historyInput).success).toBe(true);
    expect(llmInferObjectInputSchema.parse(historyInput).messages_limit).toBe(
      DEFAULT_LLM_MESSAGES_LIMIT,
    );
  });
});

describe('llm_generate_text input schema', () => {
  it('accepts prompt and system fields', () => {
    const result = llmGenerateTextInputSchema.safeParse({
      prompt: 'Write a haiku about spring.',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('defaults prompt to workflow input text', () => {
    const result = llmGenerateTextInputSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.prompt).toBe(DEFAULT_LLM_PROMPT);
  });

  it('rejects history-specific fields', () => {
    const result = llmGenerateTextInputSchema.safeParse({
      input_mode: 'history',
      messages_limit: 3,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });
});

describe('llm generation settings schemas', () => {
  const commonSettings = {
    provider: 'openai',
    model: 'gpt-4o-mini',
  };

  it('rejects output_schema for llm_generate_text settings', () => {
    const result = llmGenerateTextSettingsSchema.safeParse({
      ...commonSettings,
      output_schema: { type: 'object' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });

  it('rejects output_schema for llm_generate_reply settings', () => {
    const result = llmGenerateReplySettingsSchema.safeParse({
      ...commonSettings,
      output_schema: { type: 'object' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });

  it('requires output_schema for llm_generate_object settings', () => {
    const result = llmGenerateObjectSettingsSchema.safeParse(commonSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['output_schema'] }),
    );
  });

  it('requires output_schema for llm_infer_object settings', () => {
    const result = llmInferObjectSettingsSchema.safeParse(commonSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['output_schema'] }),
    );
  });
});
