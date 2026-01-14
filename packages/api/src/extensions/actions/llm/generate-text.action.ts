/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { ToolSet, generateText } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmBaseAction } from './llm-base.action';
import {
  LlmGenerateTextInput,
  LlmGenerateTextOutput,
  LlmGenerateTextSettings,
  llmGenerateTextInputSchema,
  llmGenerateTextOutputSchema,
  llmGenerateTextSettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmGenerateTextAction extends LlmBaseAction<
  LlmGenerateTextInput,
  LlmGenerateTextOutput,
  WorkflowRuntimeContext,
  LlmGenerateTextSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_generate_text',
        description:
          'Generates text using a language model via the Vercel AI SDK, returning the text, usage, and raw response metadata.',
        inputSchema: llmGenerateTextInputSchema,
        outputSchema: llmGenerateTextOutputSchema,
        settingsSchema: llmGenerateTextSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    settings,
    context,
  }: ActionExecutionArgs<
    LlmGenerateTextInput,
    WorkflowRuntimeContext,
    LlmGenerateTextSettings
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
    const callSettings = this.buildCallSettings(settings);
    const tools = this.buildTools(context, settings.tools) as
      | ToolSet
      | undefined;
    const { stopWhen, stepCount, toolCall } = this.buildStopWhen(
      settings,
      tools,
    );

    logger.debug(
      `Calling model "${modelId}" via llm_generate_text action using provider "${providerName}"`,
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
      ...callSettings,
      model,
      tools,
      ...(stopWhen ? { stopWhen } : {}),
    });

    return {
      text: result.text,
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

export default LlmGenerateTextAction;
