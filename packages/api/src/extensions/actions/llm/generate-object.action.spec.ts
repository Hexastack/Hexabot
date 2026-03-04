/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7, Output, generateText, jsonSchema } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmGenerateObjectAction } from './generate-object.action';

jest.mock('ai', () => ({
  generateText: jest.fn(),
  stepCountIs: jest.fn((count: number) =>
    jest.fn(({ steps }) => steps.length === count),
  ),
  hasToolCall: jest.fn((toolName: string) =>
    jest.fn(
      ({ steps }) =>
        steps[steps.length - 1]?.toolCalls?.some(
          (toolCall: any) => toolCall.toolName === toolName,
        ) ?? false,
    ),
  ),
  jsonSchema: jest.fn((schema) => ({ wrapped: schema })),
  Output: {
    object: jest.fn(({ schema, name, description }) => ({
      schema,
      name,
      description,
      type: 'object',
    })),
  },
}));

describe('LlmGenerateObjectAction', () => {
  let action: LlmGenerateObjectAction;
  let actionService: ActionService;
  const generateTextMock = generateText as jest.MockedFunction<
    typeof generateText
  >;
  const jsonSchemaMock = jsonSchema as jest.MockedFunction<typeof jsonSchema>;
  const outputObjectMock = Output.object as jest.MockedFunction<
    typeof Output.object
  >;
  const logger = { debug: jest.fn() };
  const defaultRetries = {
    max_attempts: 3,
    backoff_ms: 25,
    max_delay_ms: 10_000,
    jitter: 0,
    multiplier: 1,
  };
  const createCredentialsService = (value = 'test-key') => ({
    findOneValue: jest.fn().mockResolvedValue(value),
  });
  const createContext = (services: Record<string, unknown> = {}) =>
    ({
      services: {
        logger,
        actions: { get: jest.fn() },
        credentials: createCredentialsService(),
        ...services,
      },
    }) as unknown as WorkflowRuntimeContext;

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new LlmGenerateObjectAction(actionService);
  });

  it('uses output schema settings to request structured output', async () => {
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
      output: { foo: 'bar' },
      reasoningText: 'step-by-step',
      finishReason: 'stop',
      usage: {
        inputTokens: 10,
        inputTokenDetails: {
          noCacheTokens: 7,
          cacheReadTokens: 3,
          cacheWriteTokens: 1,
        },
        outputTokens: 20,
        totalTokens: 30,
        outputTokenDetails: {
          textTokens: 18,
          reasoningTokens: 2,
        },
        raw: { billable_units: 99 },
      },
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: { latency: 123 },
      warnings: ['warn'],
    } as any);

    const schemaDefinition = {
      title: 'TestObject',
      description: 'A simple test schema',
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
      required: ['foo'],
    } satisfies JSONSchema7;
    const settings = {
      provider: 'openai' as const,
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
      output_schema: schemaDefinition,
    };
    const input = {
      prompt: 'Generate an object',
      system: 'system prompt',
    };
    const context = createContext();
    const result = await action.execute({ input, settings, context });

    expect(loadProviderSpy).toHaveBeenCalledWith('openai', {
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com',
      organization: 'org-1',
    });
    expect(buildPromptSpy).toHaveBeenCalledWith(
      {
        input_mode: 'prompt',
        prompt: input.prompt,
        system: input.system,
      },
      context,
      settings,
    );
    expect(buildCallSettingsSpy).toHaveBeenCalledWith(settings);
    expect(createModelSpy).toHaveBeenCalledWith(provider, 'gpt-4o-mini');
    expect(jsonSchemaMock).toHaveBeenCalledWith(schemaDefinition);
    expect(outputObjectMock).toHaveBeenCalledWith({
      schema: { wrapped: schemaDefinition },
      name: 'TestObject',
      description: 'A simple test schema',
    });

    const callArgs = generateTextMock.mock.calls[0][0] as any;

    expect(callArgs).toMatchObject({
      prompt: 'Generate an object',
      system: 'system prompt',
      temperature: 0.7,
      topP: 0.8,
      topK: 5,
      presencePenalty: 0.1,
      frequencyPenalty: -0.2,
      maxOutputTokens: 50,
      seed: 7,
      model: 'model-instance',
      output: {
        schema: { wrapped: schemaDefinition },
        name: 'TestObject',
        description: 'A simple test schema',
        type: 'object',
      },
    });
    expect(callArgs.stopSequences).toBeUndefined();
    expect(logger.debug).toHaveBeenCalledWith(
      'Calling model "gpt-4o-mini" via llm_generate_object action using provider "openai"',
      expect.any(Object),
    );

    expect(result).toEqual({
      text: 'Generated text',
      object: { foo: 'bar' },
      reasoning: 'step-by-step',
      finish_reason: 'stop',
      model: 'gpt-4o-mini',
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        reasoning_tokens: 2,
        cached_input_tokens: 3,
        input_token_details: {
          no_cache_tokens: 7,
          cache_read_tokens: 3,
          cache_write_tokens: 1,
        },
        output_token_details: {
          text_tokens: 18,
          reasoning_tokens: 2,
        },
        raw: { billable_units: 99 },
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
          output_schema: { type: 'object' },
        } as any,
        context: createContext(),
      }),
    ).rejects.toThrow('A model is required to run llm_generate_object.');
  });
});
