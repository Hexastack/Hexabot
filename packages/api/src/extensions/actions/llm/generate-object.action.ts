/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { Output, ToolSet, generateText, jsonSchema } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmBaseAction } from './llm-base.action';
import {
  LlmGenerateObjectInput,
  LlmGenerateObjectOutput,
  LlmGenerateObjectSettings,
  llmGenerateObjectInputSchema,
  llmGenerateObjectOutputSchema,
  llmGenerateObjectSettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmGenerateObjectAction extends LlmBaseAction<
  LlmGenerateObjectInput,
  LlmGenerateObjectOutput,
  WorkflowRuntimeContext,
  LlmGenerateObjectSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_generate_object',
        description:
          'Generates a structured object using a language model and JSON Schema guidance, returning the parsed object, usage, and raw response metadata.',
        inputSchema: llmGenerateObjectInputSchema,
        outputSchema: llmGenerateObjectOutputSchema,
        settingsSchema: llmGenerateObjectSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    settings,
    context,
  }: ActionExecutionArgs<
    LlmGenerateObjectInput,
    WorkflowRuntimeContext,
    LlmGenerateObjectSettings
  >) {
    const logger = context.services.logger;
    const providerName = settings.provider ?? 'openai';
    const modelId = this.resolveModelId(settings);
    const providerOptions = this.buildProviderInitOptions(
      providerName,
      settings,
    );
    const provider = await this.loadProvider(providerName, providerOptions);
    const model = this.createModel(provider, modelId);
    const promptPayload = this.addMemoryToPrompt(
      await this.buildPrompt(input, context),
      context,
      settings,
    );
    // Structured outputs do not support stop sequences in the AI SDK call.
    const { stopSequences: _stopSequences, ...callSettings } =
      this.buildCallSettings(settings);
    const tools = this.buildTools(context, settings.tools) as
      | ToolSet
      | undefined;
    const { stopWhen } = this.buildStopWhen(settings, tools);
    const structuredSchema = jsonSchema(input.schema);
    const output = Output.object({
      schema: structuredSchema,
      name: input.schema_name,
      description: input.schema_description,
    });

    logger.debug(
      `Calling model "${modelId}" via llm_generate_object action using provider "${providerName}"`,
      {
        provider: providerName,
        base_url: providerOptions.baseURL,
      },
    );

    const result = await generateText({
      ...promptPayload,
      ...callSettings,
      model,
      output,
      ...(tools ? { tools } : {}),
      ...(stopWhen ? { stopWhen } : {}),
    });

    return {
      object: result.output,
      reasoning:
        result.reasoningText ??
        (result.reasoning?.length
          ? result.reasoning.map((part) => part.text).join('\n')
          : undefined),
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

export default LlmGenerateObjectAction;
