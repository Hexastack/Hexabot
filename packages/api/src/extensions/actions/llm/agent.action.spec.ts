/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ToolLoopAgent, hasToolCall, stepCountIs } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmAgentAction } from './agent.action';

jest.mock('ai', () => {
  const generateFn = jest.fn();
  const ToolLoopAgentMock = jest.fn().mockImplementation(function (options) {
    this.options = options;
    this.generate = generateFn;
  });

  return {
    ToolLoopAgent: ToolLoopAgentMock,
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
    __toolLoopAgentGenerateMock: generateFn,
  };
});

const toolLoopAgentGenerateMock = (
  jest.requireMock('ai') as { __toolLoopAgentGenerateMock: jest.Mock }
).__toolLoopAgentGenerateMock;

describe('LlmAgentAction', () => {
  let action: LlmAgentAction;
  let actionService: ActionService;
  const ToolLoopAgentMock = ToolLoopAgent as unknown as jest.Mock;
  const stepCountIsMock = stepCountIs as jest.MockedFunction<
    typeof stepCountIs
  >;
  const hasToolCallMock = hasToolCall as jest.MockedFunction<
    typeof hasToolCall
  >;
  const logger = { debug: jest.fn() };
  const defaultRetries = {
    max_attempts: 3,
    backoff_ms: 25,
    max_delay_ms: 10_000,
    jitter: 0,
    multiplier: 1,
  };
  const createCredentialService = (value = 'test-key') => ({
    findOneValue: jest.fn().mockResolvedValue(value),
  });
  const createContext = (services: Record<string, unknown> = {}) =>
    ({
      services: { logger, credentials: createCredentialService(), ...services },
    }) as unknown as WorkflowRuntimeContext;

  beforeEach(() => {
    jest.clearAllMocks();
    toolLoopAgentGenerateMock.mockReset();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new LlmAgentAction(actionService);
  });

  it('creates a ToolLoopAgent, runs it, and normalizes the response', async () => {
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
    const buildPromptSpy = jest.spyOn(action as any, 'buildPrompt');
    const buildCallSettingsSpy = jest.spyOn(action as any, 'buildCallSettings');
    const createModelSpy = jest
      .spyOn(action as any, 'createModel')
      .mockReturnValue('model-instance');
    const loadProviderSpy = jest
      .spyOn(action as any, 'loadProvider')
      .mockResolvedValue(provider);
    toolLoopAgentGenerateMock.mockResolvedValue({
      text: 'Agent reply',
      content: [{ type: 'text', text: 'Agent reply' }],
      reasoning: [{ text: 'step reasoning' }],
      reasoningText: 'step reasoning',
      files: [{ url: 'file://example' }],
      sources: [{ id: '1', title: 'source' }],
      toolCalls: [{ toolName: 'search', args: {} }],
      toolResults: [{ toolName: 'search', result: { value: 1 } }],
      finishReason: 'stop',
      rawFinishReason: 'stop',
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
      totalUsage: {
        inputTokens: 15,
        outputTokens: 25,
        totalTokens: 40,
      },
      request: { foo: 'req' },
      response: { status: 200 },
      providerMetadata: { latency: 123 },
      warnings: ['warn'],
      steps: [{ id: 'step-1' }],
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
      tools: ['search', 'translate', 'search'],
    };
    const input = {
      prompt: 'Hello there',
      system: 'system prompt',
    };
    const result = await action.execute({ input, settings, context });
    const agentOptions = ToolLoopAgentMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;

    expect(loadProviderSpy).toHaveBeenCalledWith('openai', {
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com',
      organization: 'org-1',
    });
    expect(buildPromptSpy).toHaveBeenCalledWith(input, context, settings);
    expect(buildCallSettingsSpy).toHaveBeenCalledWith(settings);
    expect(createModelSpy).toHaveBeenCalledWith(provider, 'gpt-4o-mini');
    expect(agentOptions).toEqual(
      expect.objectContaining({
        model: 'model-instance',
        instructions: 'system prompt',
        temperature: 0.7,
        topP: 0.8,
        topK: 5,
        presencePenalty: 0.1,
        frequencyPenalty: -0.2,
        stopSequences: ['stop'],
        maxOutputTokens: 50,
        seed: 7,
      }),
    );
    expect(typeof agentOptions.stopWhen).toBe('function');
    expect(agentOptions.tools).toBeDefined();
    expect(Object.keys(agentOptions.tools as Record<string, unknown>)).toEqual([
      'search',
      'translate',
    ]);
    expect(stepCountIsMock).toHaveBeenCalledWith(2);
    expect(toolLoopAgentGenerateMock).toHaveBeenCalledWith({
      prompt: 'Hello there',
    });
    expect(logger.debug).toHaveBeenCalledWith(
      'Calling model "gpt-4o-mini" via llm_agent action using provider "openai"',
      {
        provider: 'openai',
        base_url: 'https://api.openai.com',
        tools: ['search', 'translate', 'search'],
        stop_when: {
          step_count: 2,
          tool_call: undefined,
        },
      },
    );
    expect(result).toEqual({
      text: 'Agent reply',
      content: [{ type: 'text', text: 'Agent reply' }],
      reasoning: 'step reasoning',
      files: [{ url: 'file://example' }],
      sources: [{ id: '1', title: 'source' }],
      tool_calls: [{ toolName: 'search', args: {} }],
      tool_results: [{ toolName: 'search', result: { value: 1 } }],
      finish_reason: 'stop',
      raw_finish_reason: 'stop',
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
      total_usage: {
        input_tokens: 15,
        output_tokens: 25,
        total_tokens: 40,
        reasoning_tokens: undefined,
        cached_input_tokens: undefined,
        input_token_details: undefined,
        output_token_details: undefined,
        raw: undefined,
      },
      steps: [{ id: 'step-1' }],
      raw: {
        request: { foo: 'req' },
        response: { status: 200 },
        provider_metadata: { latency: 123 },
        warnings: ['warn'],
      },
    });
  });

  it('adds memory to the instructions when enabled', async () => {
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

    toolLoopAgentGenerateMock.mockResolvedValue({
      text: 'Agent reply',
      finishReason: 'stop',
      rawFinishReason: 'stop',
    } as any);

    const settings = {
      provider: 'openai',
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      memory_enabled: true,
    };
    const input = { prompt: 'Hello there', system: 'Base system' };

    await action.execute({ input, settings, context });

    const agentOptions = ToolLoopAgentMock.mock.calls[0][0] as Record<
      string,
      unknown
    >;

    expect(instances.user_profile.fields).toHaveBeenCalledWith({
      includeAdditional: true,
    });
    expect(agentOptions.instructions).toContain('Base system');
    expect(agentOptions.instructions).toContain('# Working Memory');
    expect(agentOptions.instructions).toContain('## User Profile');
    expect(agentOptions.instructions).toContain('- Name: Ada');
  });

  it('combines stop conditions when provided in settings', async () => {
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

    jest.spyOn(action as any, 'loadProvider').mockResolvedValue(provider);
    jest.spyOn(action as any, 'createModel').mockReturnValue('model-instance');
    toolLoopAgentGenerateMock.mockResolvedValue({
      text: 'Done',
      finishReason: 'tool-calls',
      rawFinishReason: 'tool-calls',
      steps: [],
    } as any);

    const settings = {
      provider: 'openai',
      timeout_ms: 0,
      retries: defaultRetries,
      model: 'gpt-4o-mini',
      api_key: 'test-key',
      tools: ['search'],
      stop_step_count: 5,
      stop_tool_call: 'finalize',
    };
    const input = { prompt: 'Hello there' };

    await action.execute({ input, settings, context });
    const { stopWhen } = ToolLoopAgentMock.mock.calls[0][0] as {
      stopWhen: Array<(params: any) => boolean>;
    };

    expect(Array.isArray(stopWhen)).toBe(true);
    expect(stepCountIsMock).toHaveBeenCalledWith(5);
    expect(hasToolCallMock).toHaveBeenCalledWith('finalize');
    expect(stopWhen[0]({ steps: new Array(5).fill({}) })).toBe(true);
    expect(
      stopWhen[1]({
        steps: [{ toolCalls: [{ toolName: 'finalize' }] }],
      }),
    ).toBe(true);
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
    ).rejects.toThrow('A model is required to run llm_agent.');
  });
});
