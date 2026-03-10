/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7, Output, generateText, jsonSchema } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { AiInferObjectAction } from './infer-object.action';

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

describe('AiInferObjectAction', () => {
  let action: AiInferObjectAction;
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
  const createModelBindings = (
    overrides: Partial<{
      provider: string;
      mode_id: string;
      api_key: string;
    }> = {},
  ): any => ({
    model: {
      provider: 'openai',
      model_id: 'gpt-4o-mini',
      api_key: 'test-key',
      ...overrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new AiInferObjectAction(actionService);
  });

  it('is conversational-only', () => {
    expect(action.name).toBe('ai_infer_object');
    expect(action.workflowTypes).toEqual([WorkflowType.conversational]);
  });

  it('forwards prompt/history input and requests structured output', async () => {
    const provider = Object.assign(
      jest.fn().mockReturnValue('model-instance'),
      {
        languageModel: jest.fn(),
      },
    );
    const context = createContext();
    const schemaDefinition = {
      title: 'IntentClassification',
      description: 'Detected intent and confidence',
      type: 'object',
      properties: {
        intent: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['intent'],
    } satisfies JSONSchema7;
    const input = {
      input_mode: 'history' as const,
      messages_limit: 3,
      system: 'system prompt',
    };
    const settings = {
      timeout_ms: 0,
      retries: defaultRetries,
      output_schema: schemaDefinition,
    };

    jest.spyOn(action as any, 'loadProvider').mockResolvedValue(provider);
    jest.spyOn(action as any, 'createModel').mockReturnValue('model-instance');
    const buildPromptSpy = jest
      .spyOn(action as any, 'buildPrompt')
      .mockResolvedValue({
        messages: [{ role: 'user', content: 'Need help with order 42' }],
        system: 'system prompt',
      });
    generateTextMock.mockResolvedValue({
      text: 'inferred',
      output: { intent: 'support', confidence: 0.92 },
      finishReason: 'stop',
      request: {},
      response: {},
      providerMetadata: {},
      warnings: [],
    } as any);

    const result = await action.execute({
      input,
      settings,
      context,
      bindings: createModelBindings(),
    });

    expect(buildPromptSpy).toHaveBeenCalledWith(input, context, []);
    expect(jsonSchemaMock).toHaveBeenCalledWith(schemaDefinition);
    expect(outputObjectMock).toHaveBeenCalledWith({
      schema: { wrapped: schemaDefinition },
      name: 'IntentClassification',
      description: 'Detected intent and confidence',
    });
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'Need help with order 42' }],
        system: 'system prompt',
        model: 'model-instance',
        output: {
          schema: { wrapped: schemaDefinition },
          name: 'IntentClassification',
          description: 'Detected intent and confidence',
          type: 'object',
        },
      }),
    );
    expect(result.object).toEqual({
      intent: 'support',
      confidence: 0.92,
    });
  });

  it('throws when the model binding is missing', async () => {
    await expect(
      action.execute({
        input: { input_mode: 'prompt', prompt: 'hi' },
        settings: {
          timeout_ms: 0,
          retries: defaultRetries,
          output_schema: { type: 'object' },
        } as any,
        context: createContext(),
        bindings: {},
      }),
    ).rejects.toThrow('A model is required to run ai_infer_object');
  });

  it('throws when the model id is missing', async () => {
    await expect(
      action.execute({
        input: { input_mode: 'prompt', prompt: 'hi' },
        settings: {
          timeout_ms: 0,
          retries: defaultRetries,
          output_schema: { type: 'object' },
        } as any,
        context: createContext(),
        bindings: {
          model: {
            openai_chatgpt: {
              provider: 'openai',
            },
          },
        } as any,
      }),
    ).rejects.toThrow('A model is required to run ai_infer_object.');
  });
});
