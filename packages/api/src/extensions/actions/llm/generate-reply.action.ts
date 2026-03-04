/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { LlmGenerateTextBaseAction } from './generate-text.base.action';
import { LlmPromptInput } from './llm-base.action';
import {
  LlmGenerateReplyInput,
  llmGenerateReplyInputSchema,
  llmGenerateReplyOutputSchema,
  llmGenerateReplySettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmGenerateReplyAction extends LlmGenerateTextBaseAction<
  LlmGenerateReplyInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_generate_reply',
        description:
          'Generates a reply from either a direct prompt or recent conversation history using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.conversational],
        inputSchema: llmGenerateReplyInputSchema,
        outputSchema: llmGenerateReplyOutputSchema,
        settingsSchema: llmGenerateReplySettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: LlmGenerateReplyInput): LlmPromptInput {
    return input;
  }
}

export default LlmGenerateReplyAction;
