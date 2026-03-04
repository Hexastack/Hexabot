/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { LlmGenerateTextBaseAction } from './generate-text.base.action';
import { LlmPromptInput } from './llm-base.action';
import {
  LlmGenerateTextInput,
  llmGenerateTextInputSchema,
  llmGenerateTextOutputSchema,
  llmGenerateTextSettingsSchema,
} from './llm-schemas';

@Injectable()
export class LlmGenerateTextAction extends LlmGenerateTextBaseAction<
  LlmGenerateTextInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'llm_generate_text',
        description:
          'Generates text from a direct prompt using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.manual, WorkflowType.scheduled],
        inputSchema: llmGenerateTextInputSchema,
        outputSchema: llmGenerateTextOutputSchema,
        settingsSchema: llmGenerateTextSettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: LlmGenerateTextInput): LlmPromptInput {
    return {
      input_mode: 'prompt',
      prompt: input.prompt,
      system: input.system,
    };
  }
}

export default LlmGenerateTextAction;
