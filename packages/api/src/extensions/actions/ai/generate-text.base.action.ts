/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ToolSet, generateText } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { ActionMetadata, ExecArgs } from '@/actions/types';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { AiBaseAction, AiPromptInput } from './ai-base.action';
import { AiGenerateTextOutput, AiGenerateTextSettings } from './ai-schemas';

export abstract class AiGenerateTextBaseAction<
  I,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
> extends AiBaseAction<I, AiGenerateTextOutput, C, AiGenerateTextSettings> {
  protected constructor(
    metadata: ActionMetadata<I, AiGenerateTextOutput, AiGenerateTextSettings>,
    actionService: ActionService,
  ) {
    super(metadata, actionService);
  }

  protected abstract resolvePromptInput(input: I): AiPromptInput;

  async execute({
    input,
    settings,
    context,
    bindings,
    signal,
  }: ExecArgs<I, C, AiGenerateTextSettings>) {
    const logger = context.services.logger;
    const modelBinding = bindings.model;
    const providerName = modelBinding?.settings?.provider ?? 'openai';
    const modelId = this.resolveModelId(modelBinding);
    const credentials = await context.services.credentials.findOneValue(
      modelBinding?.settings?.api_key,
    );
    const providerOptions = this.buildProviderInitOptions(
      providerName,
      modelBinding,
      credentials,
    );
    const provider = await this.loadProvider(providerName, providerOptions);
    const model = this.createModel(provider, modelId);
    const selectedMemorySlugs = this.resolveMemoryBindingSlugs(
      context,
      bindings.memory,
    );
    const promptPayload = await this.buildPrompt(
      this.resolvePromptInput(input),
      context,
      selectedMemorySlugs,
    );
    const callSettings = this.buildCallSettings(settings);
    const tools = (await this.buildTools(
      context,
      bindings.tools,
      bindings.mcp,
      selectedMemorySlugs,
      signal,
    )) as ToolSet | undefined;
    const toolNames = [
      ...Object.keys(bindings.tools ?? {}),
      ...Object.keys(bindings.mcp ?? {}),
    ];
    const { stopWhen, stepCount, toolCall } = this.buildStopWhen(
      settings,
      tools,
    );
    logger.debug(
      `Calling model "${modelId}" via ${this.name} action using provider "${providerName}"`,
      {
        provider: providerName,
        base_url: providerOptions.baseURL,
        tools: toolNames,
        stop_when: {
          step_count: stepCount,
          tool_call: toolCall,
        },
      },
    );
    const result = await generateText({
      ...promptPayload,
      ...callSettings,
      model,
      abortSignal: signal,
      ...(tools ? { tools } : {}),
      ...(stopWhen ? { stopWhen } : {}),
    });
    const reasoning =
      result.reasoningText ??
      (result.reasoning?.length
        ? result.reasoning.map((part) => part.text).join('\n')
        : undefined);

    return {
      text: result.text,
      ...(reasoning ? { reasoning } : {}),
      finish_reason: result.finishReason,
      model: modelId,
      usage: this.normalizeUsage(result.usage),
      raw: {
        request: result.request,
        response: result.response,
        provider_metadata: result.providerMetadata,
        warnings: result.warnings,
      },
    };
  }
}
