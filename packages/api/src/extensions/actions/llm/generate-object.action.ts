/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { generateObject, jsonSchema } from 'ai';

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
    const promptPayload = await this.buildPrompt(input, context);
    // Structured outputs do not support stop sequences in the AI SDK call.
    const { stopSequences: _stopSequences, ...callSettings } =
      this.buildCallSettings(settings);
    const structuredSchema = jsonSchema(input.schema);

    logger.debug(
      `Calling model "${modelId}" via llm_generate_object action using provider "${providerName}"`,
      {
        provider: providerName,
        base_url: providerOptions.baseURL,
      },
    );

    const result = await generateObject({
      ...promptPayload,
      ...callSettings,
      model,
      schema: structuredSchema,
      schemaName: input.schema_name,
      schemaDescription: input.schema_description,
    });

    return {
      object: result.object,
      reasoning: result.reasoning,
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
