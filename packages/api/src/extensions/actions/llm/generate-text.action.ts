/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { generateText } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowContext } from '@/workflow/services/workflow-context';

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
  WorkflowContext,
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
    WorkflowContext,
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
    const promptPayload = await this.buildPrompt(input, context);
    const callSettings = this.buildCallSettings(settings);

    logger.debug(
      `Calling model "${modelId}" via llm_generate_text action using provider "${providerName}"`,
      {
        provider: providerName,
        base_url: providerOptions.baseURL,
      },
    );

    const result = await generateText({
      ...promptPayload,
      ...callSettings,
      model,
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
