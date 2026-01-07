/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV2, ProviderV2 } from '@ai-sdk/provider';
import { ActionMetadata } from '@hexabot-ai/agentic';
import { LanguageModelUsage, ModelMessage, hasToolCall, stepCountIs } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { ActionName } from '@/actions/types';
import { Message } from '@/chat/dto/message.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { StdIncomingMessage, StdOutgoingMessage } from '@/chat/types/message';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmCommonSettings, LlmPromptInput } from './llm-schemas';

export type { LlmCommonSettings, LlmPromptInput } from './llm-schemas';

export type ProviderInitOptions = {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
};

export type LanguageModelProvider =
  | (ProviderV2 & {
      (modelId: string): LanguageModelV2;
    })
  | ProviderV2;

type ToolDefinition = {
  description?: string;
  inputSchema: unknown;
  outputSchema?: unknown;
  execute: (input: unknown) => Promise<unknown>;
};

export abstract class LlmBaseAction<
  I,
  O,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
  S extends LlmCommonSettings = LlmCommonSettings,
> extends BaseAction<I, O, C, S> {
  protected constructor(
    metadata: ActionMetadata<I, O, S>,
    actionService: ActionService,
  ) {
    super(metadata, actionService);
  }

  protected buildProviderInitOptions(
    provider: string,
    settings: S,
  ): ProviderInitOptions {
    const providerId = this.getProviderId(provider);
    const apiKey = settings.api_key;
    const baseURL = settings.base_url;
    const organization = settings.organization;

    if (!apiKey && this.shouldRequireApiKey(providerId)) {
      throw new Error(
        `No API key provided for provider "${provider}". Set settings.api_key.`,
      );
    }

    return {
      apiKey,
      baseURL,
      organization,
    };
  }

  protected shouldRequireApiKey(provider: string) {
    // Most hosted providers need an API key; skip strict enforcement for custom/local providers.
    const providerId = this.getProviderId(provider);

    return providerId === 'openai' || providerId === 'gateway';
  }

  protected async loadProvider(
    provider: string,
    options: ProviderInitOptions,
  ): Promise<LanguageModelProvider> {
    const normalized = provider.trim().toLowerCase();
    const providerId = this.getProviderId(provider);

    if (providerId === 'openai') {
      return createOpenAI(options);
    }

    if (providerId === 'gateway') {
      const { createGatewayProvider } = await import('@ai-sdk/gateway');

      return createGatewayProvider(options);
    }

    const moduleCandidates = new Set<string>([
      provider,
      normalized,
      providerId,
    ]);
    if (!normalized.startsWith('@ai-sdk/') && !providerId.startsWith('@')) {
      moduleCandidates.add(`@ai-sdk/${providerId}`);
    }
    let lastError: unknown;

    for (const moduleName of moduleCandidates) {
      try {
        const providerModule = await import(moduleName);
        const resolved = this.instantiateProviderFromModule(
          providerModule,
          providerId,
          options,
        );

        if (resolved) {
          return resolved;
        }
      } catch (error) {
        lastError = error;
      }
    }

    const errorMessage =
      `Unsupported LLM provider "${provider}". Install the matching AI SDK provider package (for example @ai-sdk/${providerId}) and ensure it exports a create* factory.` +
      (lastError ? ` Last error: ${(lastError as Error).message}` : '');

    throw new Error(errorMessage);
  }

  protected instantiateProviderFromModule(
    providerModule: Record<string, unknown>,
    provider: string,
    options: ProviderInitOptions,
  ): LanguageModelProvider | undefined {
    const providerId = this.getProviderId(provider);
    const factoryFunctions = this.getFactoryFunctions(
      providerModule,
      providerId,
    );

    for (const factory of factoryFunctions) {
      try {
        const created = factory(options);
        if (this.isLanguageModelProvider(created)) {
          return created;
        }
      } catch {
        // Ignore and try next factory candidate.
      }
    }

    const providerCandidates = [
      providerModule[provider],
      providerModule[providerId],
      providerModule.default,
      ...Object.values(providerModule),
    ];

    for (const candidate of providerCandidates) {
      if (this.isLanguageModelProvider(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  protected getFactoryFunctions(
    providerModule: Record<string, unknown>,
    provider: string,
  ): Array<(options: ProviderInitOptions) => LanguageModelProvider> {
    const normalized = provider.trim().toLowerCase();
    const pascalName = this.toPascalCase(normalized);
    const factoryNames = [
      `create${pascalName}`,
      `create${pascalName}Provider`,
      `create${pascalName}AI`,
      'createProvider',
    ];
    const seen = new Set<unknown>();
    const factories: Array<
      (options: ProviderInitOptions) => LanguageModelProvider
    > = [];

    for (const name of factoryNames) {
      const fn = providerModule[name];
      if (typeof fn === 'function' && !seen.has(fn)) {
        factories.push(
          fn as unknown as (
            options: ProviderInitOptions,
          ) => LanguageModelProvider,
        );
        seen.add(fn);
      }
    }

    for (const [exportName, value] of Object.entries(providerModule)) {
      const isCandidate =
        typeof value === 'function' &&
        exportName.startsWith('create') &&
        exportName.toLowerCase().includes(normalized);

      if (isCandidate && !seen.has(value)) {
        factories.push(
          value as unknown as (
            options: ProviderInitOptions,
          ) => LanguageModelProvider,
        );
        seen.add(value);
      }
    }

    if (factories.length === 0) {
      for (const value of Object.values(providerModule)) {
        if (typeof value === 'function' && value.name?.startsWith('create')) {
          factories.push(
            value as unknown as (
              options: ProviderInitOptions,
            ) => LanguageModelProvider,
          );
          break;
        }
      }
    }

    return factories;
  }

  protected isLanguageModelProvider(
    candidate: unknown,
  ): candidate is LanguageModelProvider {
    if (
      !candidate ||
      (typeof candidate !== 'function' && typeof candidate !== 'object')
    ) {
      return false;
    }

    return typeof (candidate as ProviderV2).languageModel === 'function';
  }

  protected createModel(provider: LanguageModelProvider, modelId: string) {
    return typeof provider === 'function'
      ? provider(modelId)
      : provider.languageModel(modelId);
  }

  protected getProviderId(provider: string) {
    const normalized = provider.trim().toLowerCase();

    return normalized.replace(/^@ai-sdk\//, '').replace(/^ai-sdk\//, '');
  }

  protected toPascalCase(value: string) {
    return value
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
  }

  protected resolveModelId(settings: S) {
    const modelId = settings.model;

    if (!modelId) {
      throw new Error(`A model is required to run ${this.name}.`);
    }

    return modelId;
  }

  protected resolveMessageContent(
    payload: StdOutgoingMessage | StdIncomingMessage,
  ) {
    if (!payload) {
      return undefined;
    }

    if ('text' in payload && typeof payload.text === 'string') {
      return payload.text;
    }

    const serialized =
      (payload as { serialized_text?: unknown }).serialized_text ?? undefined;

    if (typeof serialized === 'string') {
      return serialized;
    }

    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }

  protected normalizeMessagesForModel(
    messages: Message[],
    subscriberId: string,
  ): ModelMessage[] {
    type ConversationMessage = {
      role: Extract<ModelMessage['role'], 'user' | 'assistant'>;
      content: string;
      createdAt: Date;
    };

    const normalized: ConversationMessage[] = messages
      .map((message) => {
        const content = this.resolveMessageContent(message.message);

        if (!content) {
          return undefined;
        }

        const role: ConversationMessage['role'] =
          message.sender === subscriberId ? 'user' : 'assistant';

        return {
          role,
          content,
          createdAt: message.createdAt,
        };
      })
      .filter((message): message is ConversationMessage => Boolean(message));

    return normalized
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(({ role, content }) => ({ role, content }));
  }

  protected async buildPrompt(input: LlmPromptInput, context: C) {
    if (input.prompt) {
      return { prompt: input.prompt, system: input.system };
    }

    if (input.messages_limit !== undefined) {
      const subscriberId = context.initiatorId;
      if (!subscriberId) {
        throw new Error(
          'A subscriber id is required to load previous messages for this action.',
        );
      }

      const messageService = context.services.message;
      if (!messageService) {
        throw new Error(
          'Message service is unavailable in the workflow context.',
        );
      }

      const history = await messageService.findLastMessages(
        { id: subscriberId } as Subscriber,
        input.messages_limit,
      );
      const messages = this.normalizeMessagesForModel(history, subscriberId);

      return { messages, system: input.system };
    }

    throw new Error(
      'Provide either "prompt" or "messages_limit" to build the model request.',
    );
  }

  protected buildCallSettings(settings: S) {
    const resolved: {
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      stopSequences?: string[];
      maxOutputTokens?: number;
      seed?: number;
    } = {};
    const assign = <K extends keyof typeof resolved>(
      key: K,
      value: (typeof resolved)[K] | undefined,
    ) => {
      if (value !== undefined) {
        resolved[key] = value;
      }
    };

    assign('temperature', settings.temperature);
    assign('topP', settings.top_p);
    assign('topK', settings.top_k);
    assign('presencePenalty', settings.presence_penalty);
    assign('frequencyPenalty', settings.frequency_penalty);
    assign('stopSequences', settings.stop_sequences);
    assign('maxOutputTokens', settings.max_output_tokens);
    assign('seed', settings.seed);

    return resolved;
  }

  protected buildTools(
    context: C,
    toolNames?: string[],
  ): Record<string, ToolDefinition> | undefined {
    if (!toolNames || toolNames.length === 0) {
      return undefined;
    }

    const actionService = context.services.actions;
    if (!actionService) {
      throw new Error('Action service is unavailable in the workflow context.');
    }

    const uniqueNames = Array.from(
      new Set(
        toolNames.filter(
          (name) => typeof name === 'string' && name.trim().length > 0,
        ),
      ),
    );
    if (uniqueNames.length === 0) {
      return undefined;
    }

    return uniqueNames.reduce(
      (tools, actionName) => {
        const normalizedName = actionName.trim() as ActionName;
        const action = actionService.get(normalizedName);

        tools[normalizedName] = {
          description: action.description,
          inputSchema: action.inputSchema,
          outputSchema: action.outputSchema,
          execute: async (input) => action.run(input, context),
        };

        return tools;
      },
      {} as Record<string, ToolDefinition>,
    );
  }

  protected normalizeUsage(usage?: LanguageModelUsage) {
    if (!usage) {
      return undefined;
    }

    return {
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      total_tokens: usage.totalTokens,
      reasoning_tokens: usage.reasoningTokens,
      cached_input_tokens: usage.cachedInputTokens,
    };
  }

  protected buildStopWhen(
    settings: Partial<{
      stop_step_count: number;
      stop_tool_call: string;
    }>,
    tools?: Record<string, unknown>,
  ): {
    stopWhen:
      | ReturnType<typeof stepCountIs>
      | ReturnType<typeof hasToolCall>
      | Array<ReturnType<typeof stepCountIs> | ReturnType<typeof hasToolCall>>
      | undefined;
    stepCount?: number;
    toolCall?: string;
  } {
    const stopConditions: Array<
      ReturnType<typeof stepCountIs> | ReturnType<typeof hasToolCall>
    > = [];
    const defaultStepCount = tools ? Object.keys(tools).length : 0;
    const resolvedStepCount = settings.stop_step_count ?? defaultStepCount;

    if (resolvedStepCount > 0) {
      stopConditions.push(stepCountIs(resolvedStepCount));
    }

    const stopToolCall = settings.stop_tool_call?.trim();

    if (stopToolCall) {
      stopConditions.push(hasToolCall(stopToolCall));
    }

    const stopWhen =
      stopConditions.length === 0
        ? undefined
        : stopConditions.length === 1
          ? stopConditions[0]
          : stopConditions;

    return {
      stopWhen,
      stepCount: resolvedStepCount > 0 ? resolvedStepCount : undefined,
      toolCall: stopToolCall || undefined,
    };
  }
}
