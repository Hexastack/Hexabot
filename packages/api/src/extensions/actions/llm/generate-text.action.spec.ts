/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JSONSchema7,
  Output,
  generateText,
  hasToolCall,
  jsonSchema,
  stepCountIs,
} from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmGenerateTextAction } from './generate-text.action';

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

describe('LlmGenerateTextAction', () => {
  let action: LlmGenerateTextAction;
  let actionService: ActionService;
  const generateTextMock = generateText as jest.MockedFunction<
    typeof generateText
  >;
  const stepCountIsMock = stepCountIs as jest.MockedFunction<
    typeof stepCountIs
  >;
  const hasToolCallMock = hasToolCall as jest.MockedFunction<
    typeof hasToolCall
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
        inputTokenDetails: {
          noCacheTokens: 6,
          cacheReadTokens: 4,
          cacheWriteTokens: 1,
        },
        outputTokens: 20,
        outputTokenDetails: {
          textTokens: 18,
          reasoningTokens: 2,
        },
        totalTokens: 30,
        raw: { billable_units: 42 },
      },
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: { latency: 123 },
      warnings: ['warn'],
    } as any);

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
    };
    const input = {
      input_mode: 'prompt' as const,
      prompt: 'Hello there',
      system: 'system prompt',
    };
    const actionsService = {
      get: jest.fn().mockReturnValue({
        description: 'demo tool',
        inputSchema: {},
        outputSchema: {},
        run: jest.fn(),
      }),
    };
    const context = createContext({ actions: actionsService });
    const result = await action.execute({ input, settings, context });

    expect(loadProviderSpy).toHaveBeenCalledWith('openai', {
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com',
      organization: 'org-1',
    });
    expect(buildPromptSpy).toHaveBeenCalledWith(input, context, settings);
    expect(buildCallSettingsSpy).toHaveBeenCalledWith(settings);
    expect(createModelSpy).toHaveBeenCalledWith(provider, 'gpt-4o-mini');
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
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
      }),
    );
    expect(logger.debug).toHaveBeenCalledWith(
      'Calling model "gpt-4o-mini" via llm_generate_text action using provider "openai"',
      {
        provider: 'openai',
        base_url: 'https://api.openai.com',
        tools: undefined,
        stop_when: {
          step_count: undefined,
          tool_call: undefined,
        },
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
        cached_input_tokens: 4,
        input_token_details: {
          no_cache_tokens: 6,
          cache_read_tokens: 4,
          cache_write_tokens: 1,
        },
        output_token_details: {
          text_tokens: 18,
          reasoning_tokens: 2,
        },
        raw: { billable_units: 42 },
      },
      raw: {
        request: { foo: 'req' },
        response: { status: 200 },
        provider_metadata: { latency: 123 },
        warnings: ['warn'],
      },
    });
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
      input_mode: 'prompt' as const,
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
    expect(buildPromptSpy).toHaveBeenCalledWith(input, context, settings);
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

  it('adds memory to the system prompt when enabled', async () => {
    const provider = Object.assign(
      jest.fn().mockReturnValue('model-instance'),
      {
        languageModel: jest.fn(),
      },
    );
    const actionsService = {
      get: jest.fn().mockReturnValue({
        description: 'demo tool',
        inputSchema: {},
        outputSchema: {},
        run: jest.fn(),
      }),
    };
    const context = createContext({ actions: actionsService });
    const definitionCache = new Map([
      [
        'user_profile',
        {
          name: 'User Profile',
          slug: 'user_profile',
        },
      ],
    ]);
    const instances = {
      user_profile: {
        fields: jest
          .fn()
          .mockReturnValue([{ name: 'name', title: 'Name', value: 'Ada' }]),
      },
    };
    (context as any).memoryStore = {
      definitionCache,
      instances,
      buildUpdateMemorySchema: jest.fn().mockReturnValue({}),
    };

    jest.spyOn(action as any, 'loadProvider').mockResolvedValue(provider);
    jest.spyOn(action as any, 'createModel').mockReturnValue('model-instance');

    generateTextMock.mockResolvedValue({
      text: 'Generated text',
      finishReason: 'stop',
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: {},
      warnings: [],
    } as any);

    const settings = {
      provider: 'openai' as const,
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      memory_enabled: true,
    };
    const input = {
      input_mode: 'prompt' as const,
      prompt: 'Hello there',
      system: 'Base system',
    };

    await action.execute({ input, settings, context });

    const callArgs = generateTextMock.mock.calls[0][0] as any;

    expect(instances.user_profile.fields).toHaveBeenCalledWith({
      includeAdditional: true,
    });
    expect(actionsService.get).toHaveBeenCalledWith('update_memory');
    expect(callArgs.tools).toHaveProperty('update_memory');
    expect(callArgs.tools.update_memory.description).toBe('demo tool');
    expect(callArgs.system).toContain('Base system');
    expect(callArgs.system).toContain('# Working Memory');
    expect(callArgs.system).toContain('## User Profile');
    expect(callArgs.system).toContain('- Name: Ada');
  });

  it('defaults stopWhen to the number of provided tools', async () => {
    const provider = Object.assign(
      jest.fn().mockReturnValue('model-instance'),
      {
        languageModel: jest.fn(),
      },
    );
    const actionsService = {
      get: jest.fn().mockReturnValue({
        description: 'demo',
        inputSchema: {},
        outputSchema: {},
        run: jest.fn(),
      }),
    };
    const context = createContext({ actions: actionsService });

    jest.spyOn(action as any, 'loadProvider').mockResolvedValue(provider);
    jest.spyOn(action as any, 'buildPrompt');
    jest.spyOn(action as any, 'buildCallSettings');
    jest.spyOn(action as any, 'createModel').mockReturnValue('model-instance');
    generateTextMock.mockResolvedValue({
      text: 'Generated text',
      finishReason: 'stop',
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: {},
      warnings: [],
    } as any);

    const settings = {
      provider: 'openai' as const,
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      tools: ['search', 'translate', 'search'],
    };
    const input = { input_mode: 'prompt' as const, prompt: 'Hello there' };
    const result = await action.execute({ input, settings, context });
    const stopWhen = (generateTextMock.mock.calls[0][0] as any).stopWhen;

    expect(stepCountIsMock).toHaveBeenCalledWith(2);
    expect(typeof stopWhen).toBe('function');
    expect(stopWhen({ steps: [{}, {}] })).toBe(true);
    expect(stopWhen({ steps: [{}] })).toBe(false);
    expect(result.text).toBe('Generated text');
  });

  it('combines step count and tool call stop conditions from settings', async () => {
    const provider = Object.assign(
      jest.fn().mockReturnValue('model-instance'),
      {
        languageModel: jest.fn(),
      },
    );
    const actionsService = {
      get: jest.fn().mockReturnValue({
        description: 'demo',
        inputSchema: {},
        outputSchema: {},
        run: jest.fn(),
      }),
    };
    const context = createContext({ actions: actionsService });

    jest.spyOn(action as any, 'loadProvider').mockResolvedValue(provider);
    jest.spyOn(action as any, 'buildPrompt');
    jest.spyOn(action as any, 'buildCallSettings');
    jest.spyOn(action as any, 'createModel').mockReturnValue('model-instance');
    generateTextMock.mockResolvedValue({
      text: 'Generated text',
      finishReason: 'stop',
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: {},
      warnings: [],
    } as any);

    const settings = {
      provider: 'openai' as const,
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      tools: ['search'],
      stop_step_count: 5,
      stop_tool_call: 'finalize',
    };
    const input = { input_mode: 'prompt' as const, prompt: 'Hello there' };

    await action.execute({ input, settings, context });
    const stopWhen = (generateTextMock.mock.calls[0][0] as any)
      .stopWhen as Array<(params: any) => boolean>;

    expect(Array.isArray(stopWhen)).toBe(true);
    expect(stepCountIsMock).toHaveBeenCalledWith(5);
    expect(hasToolCallMock).toHaveBeenCalledWith('finalize');
    expect(stopWhen[0]({ steps: new Array(5).fill({}) })).toBe(true);
    expect(stopWhen[0]({ steps: new Array(4).fill({}) })).toBe(false);
    expect(
      stopWhen[1]({
        steps: [{ toolCalls: [{ toolName: 'finalize' }] }],
      }),
    ).toBe(true);
    expect(
      stopWhen[1]({
        steps: [{ toolCalls: [{ toolName: 'other' }] }],
      }),
    ).toBe(false);
  });

  it('throws when the model id is missing', async () => {
    await expect(
      action.execute({
        input: { input_mode: 'prompt', prompt: 'hi' },
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
