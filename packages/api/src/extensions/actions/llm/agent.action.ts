/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { ToolLoopAgent, ToolSet } from 'ai';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { LlmBaseAction } from './llm-base.action';
import {
  LlmAgentInput,
  LlmAgentOutput,
  LlmAgentSettings,
  llmAgentInputSchema,
  llmAgentOutputSchema,
  llmAgentSettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmAgentAction extends LlmBaseAction<
  LlmAgentInput,
  LlmAgentOutput,
  WorkflowRuntimeContext,
  LlmAgentSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_agent',
        description:
          'Runs a ToolLoopAgent with optional tools to generate multi-step outputs via the Vercel AI SDK.',
        inputSchema: llmAgentInputSchema,
        outputSchema: llmAgentOutputSchema,
        settingsSchema: llmAgentSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    settings,
    context,
  }: ActionExecutionArgs<
    LlmAgentInput,
    WorkflowRuntimeContext,
    LlmAgentSettings
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
    const tools = this.buildTools(context, settings.tools) as
      | ToolSet
      | undefined;
    const { stopWhen, stepCount, toolCall } = this.buildStopWhen(
      settings,
      tools,
    );
    const instructions =
      input.instructions ?? promptPayload.system ?? settings.instructions;
    const agent = new ToolLoopAgent({
      ...callSettings,
      ...(instructions ? { instructions } : {}),
      ...(stopWhen ? { stopWhen } : {}),
      model,
      tools,
    });

    logger.debug(
      `Calling model "${modelId}" via llm_agent action using provider "${providerName}"`,
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

    const { system: _system, ...prompt } = promptPayload;
    const result = await agent.generate(prompt);

    return {
      text: result.text,
      content: result.content,
      reasoning:
        result.reasoningText ??
        (result.reasoning?.length
          ? result.reasoning.map((part) => part.text).join('\n')
          : undefined),
      files: result.files,
      sources: result.sources,
      tool_calls: result.toolCalls,
      tool_results: result.toolResults,
      finish_reason: result.finishReason,
      raw_finish_reason: result.rawFinishReason,
      model: modelId,
      usage: this.normalizeUsage(result.usage),
      total_usage: this.normalizeUsage(result.totalUsage),
      steps: result.steps,
      raw: {
        request: result.request,
        response: result.response,
        provider_metadata: result.providerMetadata,
        warnings: result.warnings,
      },
    };
  }
}

export default LlmAgentAction;
