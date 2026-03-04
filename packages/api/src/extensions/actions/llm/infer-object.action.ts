/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { LlmGenerateObjectBaseAction } from './generate-object.base.action';
import { LlmPromptInput } from './llm-base.action';
import {
  LlmInferObjectInput,
  llmInferObjectInputSchema,
  llmInferObjectOutputSchema,
  llmInferObjectSettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmInferObjectAction extends LlmGenerateObjectBaseAction<
  LlmInferObjectInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_infer_object',
        description:
          'Generates structured output from a direct prompt or recent conversation history using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.conversational],
        inputSchema: llmInferObjectInputSchema,
        outputSchema: llmInferObjectOutputSchema,
        settingsSchema: llmInferObjectSettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: LlmInferObjectInput): LlmPromptInput {
    return input;
  }
}

export default LlmInferObjectAction;
