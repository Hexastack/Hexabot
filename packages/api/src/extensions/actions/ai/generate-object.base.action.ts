/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { JSONSchema7, Output, ToolSet, generateText, jsonSchema } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { ActionMetadata } from '@/actions/types';
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
  }: ActionExecutionArgs<I, C, AiGenerateObjectSettings>) {
    const logger = context.services.logger;
    const providerName = settings.provider ?? 'openai';
    const modelId = this.resolveModelId(settings);
    const credentials = await context.services.credentials.findOneValue(
      settings.api_key,
    );
    const providerOptions = this.buildProviderInitOptions(
      providerName,
      settings,
      credentials,
    );
    const provider = await this.loadProvider(providerName, providerOptions);
    const model = this.createModel(provider, modelId);
    const promptPayload = await this.buildPrompt(
      this.resolvePromptInput(input),
      context,
      settings,
    );
    const callSettings = this.buildCallSettings(settings);
    // Structured outputs do not support stop sequences in the AI SDK call.
    const { stopSequences: _stopSequences, ...callSettingsWithoutStops } =
      callSettings;
    const tools = this.buildTools(
      context,
      settings.tools,
      settings.memory_enabled,
    ) as ToolSet | undefined;
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
        tools: settings.tools,
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
