/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createGatewayProvider } from '@ai-sdk/gateway';
import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelUsage } from 'ai';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { Message } from '@/chat/dto/message.dto';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import {
  LanguageModelProvider,
  LlmBaseAction,
  LlmCommonSettings,
  ProviderInitOptions,
} from './llm-base.action';

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

jest.mock('@ai-sdk/gateway', () => ({
  createGatewayProvider: jest.fn(),
}));

jest.mock(
  'custom-provider',
  () => ({
    createCustomProvider: jest.fn(
      (options: ProviderInitOptions): LanguageModelProvider =>
        ({
          languageModel: jest
            .fn()
            .mockReturnValue(`model-${options.apiKey ?? 'none'}`),
          textEmbeddingModel: jest.fn(),
          imageModel: jest.fn(),
        }) as LanguageModelProvider,
    ),
  }),
  { virtual: true },
);

class TestLlmBaseAction extends LlmBaseAction<
  Record<string, unknown>,
  unknown,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_test_action',
        description: 'Test action',
        inputSchema: z.any(),
        outputSchema: z.any(),
        settingsSchema: z.any(),
      },
      actionService,
    );
  }

  async execute(): Promise<unknown> {
    return null;
  }

  public buildProviderInitOptionsPublic(
    provider: string,
    settings: LlmCommonSettings,
  ) {
    return this.buildProviderInitOptions(provider, settings);
  }

  public shouldRequireApiKeyPublic(provider: string) {
    return this.shouldRequireApiKey(provider);
  }

  public loadProviderPublic(provider: string, options: ProviderInitOptions) {
    return this.loadProvider(provider, options);
  }

  public instantiateProviderFromModulePublic(
    providerModule: Record<string, unknown>,
    provider: string,
    options: ProviderInitOptions,
  ) {
    return this.instantiateProviderFromModule(
      providerModule,
      provider,
      options,
    );
  }

  public getFactoryFunctionsPublic(
    providerModule: Record<string, unknown>,
    provider: string,
  ) {
    return this.getFactoryFunctions(providerModule, provider);
  }

  public isLanguageModelProviderPublic(candidate: unknown) {
    return this.isLanguageModelProvider(candidate);
  }

  public createModelPublic(provider: LanguageModelProvider, modelId: string) {
    return this.createModel(provider, modelId);
  }

  public getProviderIdPublic(provider: string) {
    return this.getProviderId(provider);
  }

  public toPascalCasePublic(value: string) {
    return this.toPascalCase(value);
  }

  public resolveModelIdPublic(settings: LlmCommonSettings) {
    return this.resolveModelId(settings);
  }

  public buildPromptPublic(input: unknown, context: WorkflowRuntimeContext) {
    return this.buildPrompt(input as any, context);
  }

  public buildCallSettingsPublic(settings: LlmCommonSettings) {
    return this.buildCallSettings(settings);
  }

  public normalizeUsagePublic(usage?: LanguageModelUsage) {
    return this.normalizeUsage(usage);
  }
}

const createProviderStub = () =>
  ({
    languageModel: jest.fn(),
    textEmbeddingModel: jest.fn(),
    imageModel: jest.fn(),
  }) as LanguageModelProvider;

describe('LlmBaseAction', () => {
  let action: TestLlmBaseAction;
  let actionService: ActionService;

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new TestLlmBaseAction(actionService);
  });

  describe('buildProviderInitOptions', () => {
    it('returns init options when provided', () => {
      const options = action.buildProviderInitOptionsPublic('custom', {
        api_key: 'key',
        base_url: 'https://example.com',
        organization: 'org',
      } as LlmCommonSettings);

      expect(options).toEqual({
        apiKey: 'key',
        baseURL: 'https://example.com',
        organization: 'org',
      });
    });

    it('throws when api key is required but missing', () => {
      expect(() =>
        action.buildProviderInitOptionsPublic(
          'openai',
          {} as LlmCommonSettings,
        ),
      ).toThrow(
        'No API key provided for provider "openai". Set settings.api_key.',
      );
    });
  });

  describe('shouldRequireApiKey', () => {
    it('enforces api key for hosted providers', () => {
      expect(action.shouldRequireApiKeyPublic('openai')).toBe(true);
      expect(action.shouldRequireApiKeyPublic('gateway')).toBe(true);
    });

    it('allows local providers without api key', () => {
      expect(action.shouldRequireApiKeyPublic('local')).toBe(false);
      expect(action.shouldRequireApiKeyPublic('@ai-sdk/local')).toBe(false);
    });
  });

  describe('loadProvider', () => {
    it('loads OpenAI provider via createOpenAI', async () => {
      const provider = createProviderStub();

      (createOpenAI as jest.Mock).mockReturnValue(provider);

      const result = await action.loadProviderPublic('openai', {
        apiKey: 'api-key',
      });

      expect(createOpenAI).toHaveBeenCalledWith({ apiKey: 'api-key' });
      expect(result).toBe(provider);
    });

    it('loads gateway provider via createGatewayProvider', async () => {
      const provider = createProviderStub();
      const options: ProviderInitOptions = { baseURL: 'https://gateway' };

      (createGatewayProvider as jest.Mock).mockReturnValue(provider);

      const result = await action.loadProviderPublic('gateway', options);

      expect(createGatewayProvider).toHaveBeenCalledWith(options);
      expect(result).toBe(provider);
    });

    it('loads custom provider via dynamic import', async () => {
      const options: ProviderInitOptions = {
        apiKey: 'custom-key',
        baseURL: 'https://custom',
      };
      const provider = await action.loadProviderPublic(
        'custom-provider',
        options,
      );
      // @ts-expect-error virtual module provided via jest.mock
      const { createCustomProvider } = await import('custom-provider');

      expect((createCustomProvider as jest.Mock).mock.calls[0][0]).toEqual(
        options,
      );
      expect(
        action.isLanguageModelProviderPublic(provider as LanguageModelProvider),
      ).toBe(true);
    });

    it('throws when provider cannot be resolved', async () => {
      await expect(
        action.loadProviderPublic('missing-provider', {}),
      ).rejects.toThrow(/Unsupported LLM provider "missing-provider"/);
    });
  });

  describe('instantiateProviderFromModule', () => {
    it('uses the first working factory', () => {
      const provider = createProviderStub();
      const failingFactory = jest.fn(() => {
        throw new Error('fail');
      });
      const succeedingFactory = jest.fn().mockReturnValue(provider);
      const resolved = action.instantiateProviderFromModulePublic(
        {
          createDemo: failingFactory,
          createDemoAI: succeedingFactory,
        },
        'demo',
        {},
      );

      expect(failingFactory).toHaveBeenCalledTimes(1);
      expect(succeedingFactory).toHaveBeenCalledWith({});
      expect(resolved).toBe(provider);
    });

    it('falls back to provider exports when no factories succeed', () => {
      const provider = createProviderStub();
      const resolved = action.instantiateProviderFromModulePublic(
        {
          default: provider,
        },
        'demo',
        {},
      );

      expect(resolved).toBe(provider);
    });

    it('returns undefined when nothing matches', () => {
      const resolved = action.instantiateProviderFromModulePublic(
        { noop: 'value' },
        'demo',
        {},
      );

      expect(resolved).toBeUndefined();
    });
  });

  describe('getFactoryFunctions', () => {
    it('collects expected factory candidates and skips duplicates', () => {
      const sharedFactory = jest.fn();
      const aiFactory = jest.fn();
      const providerFactory = jest.fn();
      const extraFactory = jest.fn();
      const module: Record<string, unknown> = {
        createDemo: sharedFactory,
        createDemoProvider: sharedFactory,
        createDemoAI: aiFactory,
        createProvider: providerFactory,
        createDemoExtra: extraFactory,
      };
      const factories = action.getFactoryFunctionsPublic(module, 'demo');

      expect(factories).toEqual([
        sharedFactory,
        aiFactory,
        providerFactory,
        extraFactory,
      ]);
    });

    it('falls back to the first create* function when no named factories match', () => {
      const fallbackFactory = function createFallback() {
        return { languageModel: jest.fn() };
      };
      const factories = action.getFactoryFunctionsPublic(
        {
          fallbackFactory,
        },
        'demo',
      );

      expect(factories).toEqual([fallbackFactory]);
    });
  });

  describe('isLanguageModelProvider', () => {
    it('detects provider objects and functions', () => {
      const providerObj = { languageModel: jest.fn() };
      const providerFn = Object.assign(jest.fn(), {
        languageModel: jest.fn(),
      });

      expect(action.isLanguageModelProviderPublic(providerObj)).toBe(true);
      expect(action.isLanguageModelProviderPublic(providerFn)).toBe(true);
    });

    it('rejects non-provider values', () => {
      expect(action.isLanguageModelProviderPublic(null)).toBe(false);
      expect(action.isLanguageModelProviderPublic({})).toBe(false);
      expect(action.isLanguageModelProviderPublic(123)).toBe(false);
    });
  });

  describe('createModel', () => {
    it('creates a model using a provider function', () => {
      const provider = Object.assign(jest.fn().mockReturnValue('model'), {
        languageModel: jest.fn(),
        textEmbeddingModel: jest.fn(),
        imageModel: jest.fn(),
      }) as LanguageModelProvider;
      const model = action.createModelPublic(provider, 'gpt');

      expect(provider).toHaveBeenCalledWith('gpt');
      expect(model).toBe('model');
    });

    it('creates a model using provider.languageModel', () => {
      const provider = createProviderStub();
      (provider.languageModel as jest.Mock).mockReturnValue('model');

      const model = action.createModelPublic(provider, 'gpt');

      expect(provider.languageModel).toHaveBeenCalledWith('gpt');
      expect(model).toBe('model');
    });
  });

  describe('provider and naming helpers', () => {
    it('normalizes provider id and pascal case', () => {
      expect(action.getProviderIdPublic('  @ai-sdk/OpenAI  ')).toBe('openai');
      expect(action.getProviderIdPublic('ai-sdk/custom')).toBe('custom');
      expect(action.toPascalCasePublic('custom-llm_provider')).toBe(
        'CustomLlmProvider',
      );
    });
  });

  describe('resolveModelId', () => {
    it('returns the model when provided', () => {
      expect(
        action.resolveModelIdPublic({ model: 'gpt-4o' } as LlmCommonSettings),
      ).toBe('gpt-4o');
    });

    it('throws when model is missing', () => {
      expect(() =>
        action.resolveModelIdPublic({} as LlmCommonSettings),
      ).toThrow('A model is required to run llm_test_action.');
    });
  });

  describe('buildPrompt', () => {
    const createMessage = (overrides: Partial<Message>) =>
      ({
        id: overrides.id ?? 'message-id',
        mid: overrides.mid,
        createdAt: overrides.createdAt ?? new Date('2024-01-01T10:00:00Z'),
        updatedAt: overrides.updatedAt ?? new Date('2024-01-01T10:00:00Z'),
        sender: overrides.sender,
        recipient: overrides.recipient,
        sentBy: overrides.sentBy,
        message: overrides.message ?? { text: 'hello' },
        read: overrides.read ?? false,
        delivery: overrides.delivery ?? false,
        handover: overrides.handover ?? false,
      }) as Message;

    it('builds prompt payload from the latest messages using the provided limit', async () => {
      const initiatorId = 'subscriber-123';
      const history = [
        createMessage({
          id: 'message-1',
          createdAt: new Date('2024-01-01T09:00:00Z'),
          sender: initiatorId,
          message: { text: 'Hi' },
        }),
        createMessage({
          id: 'message-2',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          sender: 'bot',
          recipient: initiatorId,
          message: { text: 'Hello there' },
        }),
      ];
      const messageService = {
        findLastMessages: jest.fn().mockResolvedValue(history),
      };
      const context = {
        initiatorId,
        services: { message: messageService },
      } as unknown as WorkflowRuntimeContext;
      const result = await action.buildPromptPublic(
        {
          messages_limit: 2,
          system: 'system prompt',
        },
        context,
      );

      expect(messageService.findLastMessages).toHaveBeenCalledWith(
        { id: initiatorId },
        2,
      );
      expect(result).toEqual({
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello there' },
        ],
        system: 'system prompt',
      });
    });

    it('builds prompt payload from prompt string', async () => {
      const result = await action.buildPromptPublic(
        {
          prompt: 'Tell me a joke',
          system: 'system prompt',
        },
        {} as WorkflowRuntimeContext,
      );

      expect(result).toEqual({
        prompt: 'Tell me a joke',
        system: 'system prompt',
      });
    });

    it('throws when subscriber id is missing for message history requests', async () => {
      await expect(
        action.buildPromptPublic({ messages_limit: 1 }, {
          services: { message: { findLastMessages: jest.fn() } },
        } as unknown as WorkflowRuntimeContext),
      ).rejects.toThrow(
        'A subscriber id is required to load previous messages for this action.',
      );
    });

    it('throws when neither prompt nor message limit are provided', async () => {
      await expect(
        action.buildPromptPublic(
          {} as unknown as Record<string, unknown>,
          {} as WorkflowRuntimeContext,
        ),
      ).rejects.toThrow(
        'Provide either "prompt" or "messages_limit" to build the model request.',
      );
    });
  });

  describe('buildCallSettings', () => {
    it('maps snake_case settings to SDK call settings', () => {
      const result = action.buildCallSettingsPublic({
        temperature: 0.7,
        top_p: 0.9,
        top_k: 10,
        presence_penalty: 0.5,
        frequency_penalty: -0.1,
        stop_sequences: ['stop'],
        max_output_tokens: 50,
        seed: 7,
      } as LlmCommonSettings);

      expect(result).toEqual({
        temperature: 0.7,
        topP: 0.9,
        topK: 10,
        presencePenalty: 0.5,
        frequencyPenalty: -0.1,
        stopSequences: ['stop'],
        maxOutputTokens: 50,
        seed: 7,
      });
    });

    it('omits undefined settings', () => {
      const result = action.buildCallSettingsPublic({} as LlmCommonSettings);

      expect(result).toEqual({});
    });
  });

  describe('normalizeUsage', () => {
    it('returns undefined when usage is missing', () => {
      expect(action.normalizeUsagePublic()).toBeUndefined();
    });

    it('normalizes usage fields to snake_case', () => {
      const normalized = action.normalizeUsagePublic({
        inputTokens: 10,
        inputTokenDetails: {
          noCacheTokens: 6,
          cacheReadTokens: 3,
          cacheWriteTokens: 1,
        },
        outputTokens: 20,
        outputTokenDetails: {
          textTokens: 18,
          reasoningTokens: 5,
        },
        totalTokens: 30,
        raw: { billable_units: 10 },
      } as unknown as LanguageModelUsage);

      expect(normalized).toEqual({
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        reasoning_tokens: 5,
        cached_input_tokens: 3,
        input_token_details: {
          no_cache_tokens: 6,
          cache_read_tokens: 3,
          cache_write_tokens: 1,
        },
        output_token_details: {
          text_tokens: 18,
          reasoning_tokens: 5,
        },
        raw: { billable_units: 10 },
      });
    });
  });
});
