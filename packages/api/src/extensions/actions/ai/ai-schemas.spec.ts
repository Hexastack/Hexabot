/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  DEFAULT_AI_MESSAGES_LIMIT,
  DEFAULT_AI_PROMPT,
  aiAgentInputSchema,
  aiGenerateObjectSettingsSchema,
  aiGenerateReplyInputSchema,
  aiGenerateReplySettingsSchema,
  aiGenerateTextInputSchema,
  aiGenerateTextSettingsSchema,
  aiInferObjectInputSchema,
  aiInferObjectSettingsSchema,
  aiPromptSchema,
} from './ai-schemas';

describe('ai prompt schemas', () => {
  it('accepts prompt mode with prompt text', () => {
    const result = aiPromptSchema.safeParse({
      input_mode: 'prompt',
      prompt: 'Tell me a joke',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('accepts history mode with a positive messages limit', () => {
    const result = aiPromptSchema.safeParse({
      input_mode: 'history',
      messages_limit: 5,
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('defaults prompt mode prompt to workflow input text', () => {
    const result = aiPromptSchema.safeParse({
      input_mode: 'prompt',
    });

    expect(result.success).toBe(true);
    expect(result.data?.prompt).toBe(DEFAULT_AI_PROMPT);
  });

  it('defaults missing input mode to prompt', () => {
    const result = aiPromptSchema.safeParse({
      prompt: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.data?.input_mode).toBe('prompt');
  });

  it('defaults history mode messages_limit to 4 when missing', () => {
    const result = aiPromptSchema.safeParse({
      input_mode: 'history',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
    expect(result.data?.messages_limit).toBe(DEFAULT_AI_MESSAGES_LIMIT);
  });

  it('accepts prompt mode even when messages_limit is provided', () => {
    const result = aiPromptSchema.safeParse({
      input_mode: 'prompt',
      prompt: 'Tell me a joke',
      messages_limit: 2,
    });

    expect(result.success).toBe(true);
    expect(result.data?.messages_limit).toBe(2);
  });

  it('keeps ai_generate_reply and ai_agent input schemas aligned', () => {
    const promptInput = {
      input_mode: 'prompt',
    };
    const historyInput = {
      input_mode: 'history',
    };

    expect(aiGenerateReplyInputSchema.safeParse(promptInput).success).toBe(
      true,
    );
    expect(aiAgentInputSchema.safeParse(historyInput).success).toBe(true);
    expect(aiGenerateReplyInputSchema.parse(promptInput).prompt).toBe(
      DEFAULT_AI_PROMPT,
    );
    expect(aiAgentInputSchema.parse(historyInput).messages_limit).toBe(
      DEFAULT_AI_MESSAGES_LIMIT,
    );
  });

  it('keeps ai_infer_object and ai_agent input schemas aligned', () => {
    const historyInput = {
      input_mode: 'history',
    };

    expect(aiInferObjectInputSchema.safeParse(historyInput).success).toBe(true);
    expect(aiAgentInputSchema.safeParse(historyInput).success).toBe(true);
    expect(aiInferObjectInputSchema.parse(historyInput).messages_limit).toBe(
      DEFAULT_AI_MESSAGES_LIMIT,
    );
  });
});

describe('ai_generate_text input schema', () => {
  it('accepts prompt and system fields', () => {
    const result = aiGenerateTextInputSchema.safeParse({
      prompt: 'Write a haiku about spring.',
      system: 'You are a helpful assistant.',
    });

    expect(result.success).toBe(true);
  });

  it('defaults prompt to workflow input text', () => {
    const result = aiGenerateTextInputSchema.safeParse({});

    expect(result.success).toBe(true);
    expect(result.data?.prompt).toBe(DEFAULT_AI_PROMPT);
  });

  it('rejects history-specific fields', () => {
    const result = aiGenerateTextInputSchema.safeParse({
      input_mode: 'history',
      messages_limit: 3,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });
});

describe('ai generation settings schemas', () => {
  const commonSettings = {
    provider: 'openai',
    model: 'gpt-4o-mini',
  };

  it('rejects output_schema for ai_generate_text settings', () => {
    const result = aiGenerateTextSettingsSchema.safeParse({
      ...commonSettings,
      output_schema: { type: 'object' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });

  it('rejects output_schema for ai_generate_reply settings', () => {
    const result = aiGenerateReplySettingsSchema.safeParse({
      ...commonSettings,
      output_schema: { type: 'object' },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ code: 'unrecognized_keys' }),
    );
  });

  it('requires output_schema for ai_generate_object settings', () => {
    const result = aiGenerateObjectSettingsSchema.safeParse(commonSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['output_schema'] }),
    );
  });

  it('requires output_schema for ai_infer_object settings', () => {
    const result = aiInferObjectSettingsSchema.safeParse(commonSettings);

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['output_schema'] }),
    );
  });
});
