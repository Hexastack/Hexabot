/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { generateText } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { LlmGenerateTextAction } from './generate-text.action';

jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

describe('LlmGenerateTextAction', () => {
  let action: LlmGenerateTextAction;
  let actionService: ActionService;
  const generateTextMock = generateText as jest.MockedFunction<
    typeof generateText
  >;
  const logger = { debug: jest.fn() };
  const defaultRetries = {
    max_attempts: 3,
    backoff_ms: 25,
    max_delay_ms: 10_000,
    jitter: 0,
    multiplier: 1,
  };
  const createContext = () =>
    ({ services: { logger } }) as unknown as ConversationalWorkflowContext;

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new LlmGenerateTextAction(actionService);
  });

  it('calls the provider and normalizes the generateText response', async () => {
    const provider = Object.assign(
      jest.fn().mockReturnValue('model-instance'),
      {
        languageModel: jest.fn(),
      },
    );
    const loadProviderSpy = jest
      .spyOn(action as any, 'loadProvider')
      .mockResolvedValue(provider);
    const buildPromptSpy = jest.spyOn(action as any, 'buildPrompt');
    const buildCallSettingsSpy = jest.spyOn(action as any, 'buildCallSettings');
    const createModelSpy = jest.spyOn(action as any, 'createModel');

    generateTextMock.mockResolvedValue({
      text: 'Generated text',
      finishReason: 'stop',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        reasoningTokens: 2,
        cachedInputTokens: 1,
      },
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: { latency: 123 },
      warnings: ['warn'],
    } as any);

    const settings = {
      provider: 'openai',
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      base_url: 'https://api.openai.com',
      organization: 'org-1',
      temperature: 0.7,
      top_p: 0.8,
      top_k: 5,
      presence_penalty: 0.1,
      frequency_penalty: -0.2,
      stop_sequences: ['stop'],
      max_output_tokens: 50,
      seed: 7,
    };
    const input = { prompt: 'Hello there', system: 'system prompt' };
    const context = createContext();
    const result = await action.execute({ input, settings, context });

    expect(loadProviderSpy).toHaveBeenCalledWith('openai', {
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com',
      organization: 'org-1',
    });
    expect(buildPromptSpy).toHaveBeenCalledWith(input, context);
    expect(buildCallSettingsSpy).toHaveBeenCalledWith(settings);
    expect(createModelSpy).toHaveBeenCalledWith(provider, 'gpt-4o-mini');
    expect(generateTextMock).toHaveBeenCalledWith({
      prompt: 'Hello there',
      system: 'system prompt',
      temperature: 0.7,
      topP: 0.8,
      topK: 5,
      presencePenalty: 0.1,
      frequencyPenalty: -0.2,
      stopSequences: ['stop'],
      maxOutputTokens: 50,
      seed: 7,
      model: 'model-instance',
    });
    expect(logger.debug).toHaveBeenCalledWith(
      'Calling model "gpt-4o-mini" via llm_generate_text action using provider "openai"',
      {
        provider: 'openai',
        base_url: 'https://api.openai.com',
      },
    );
    expect(result).toEqual({
      text: 'Generated text',
      finish_reason: 'stop',
      model: 'gpt-4o-mini',
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        reasoning_tokens: 2,
        cached_input_tokens: 1,
      },
      raw: {
        request: { foo: 'req' },
        response: { status: 200 },
        provider_metadata: { latency: 123 },
        warnings: ['warn'],
      },
    });
  });

  it('throws when the model id is missing', async () => {
    await expect(
      action.execute({
        input: { prompt: 'hi' },
        settings: {
          provider: 'openai',
          timeout_ms: 0,
          retries: defaultRetries,
          api_key: 'key',
        } as any,
        context: createContext(),
      }),
    ).rejects.toThrow('A model is required to run llm_generate_text.');
  });
});
