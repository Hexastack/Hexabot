/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7, Output, ToolSet, generateText, jsonSchema } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { ActionMetadata, ExecArgs } from '@/actions/types';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { AiBaseAction, AiPromptInput } from './ai-base.action';
import { AiGenerateObjectOutput, AiGenerateObjectSettings } from './ai-schemas';

export abstract class AiGenerateObjectBaseAction<
  I,
  C extends WorkflowRuntimeContext = WorkflowRuntimeContext,
> extends AiBaseAction<I, AiGenerateObjectOutput, C, AiGenerateObjectSettings> {
  protected constructor(
    metadata: ActionMetadata<
      I,
      AiGenerateObjectOutput,
      AiGenerateObjectSettings
    >,
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
  }: ExecArgs<I, C, AiGenerateObjectSettings>) {
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
    // Structured outputs do not support stop sequences in the AI SDK call.
    const { stopSequences: _stopSequences, ...callSettingsWithoutStops } =
      callSettings;
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
    const outputSchema = settings.output_schema as JSONSchema7;
    const output = Output.object({
      schema: jsonSchema(outputSchema),
      name: outputSchema.title,
      description: outputSchema.description,
    });

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
      ...callSettingsWithoutStops,
      model,
      output,
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
      object: result.output,
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
