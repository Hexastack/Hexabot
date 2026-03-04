/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { AiPromptInput } from './ai-base.action';
import {
  AiGenerateTextInput,
  aiGenerateTextInputSchema,
  aiGenerateTextOutputSchema,
  aiGenerateTextSettingsSchema,
} from './ai-schemas';
import { AiGenerateTextBaseAction } from './generate-text.base.action';

@Injectable()
export class AiGenerateTextAction extends AiGenerateTextBaseAction<
  AiGenerateTextInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'ai_generate_text',
        description:
          'Generates text from a direct prompt using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.manual, WorkflowType.scheduled],
        inputSchema: aiGenerateTextInputSchema,
        outputSchema: aiGenerateTextOutputSchema,
        settingsSchema: aiGenerateTextSettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: AiGenerateTextInput): AiPromptInput {
    return {
      input_mode: 'prompt',
      prompt: input.prompt,
      system: input.system,
    };
  }
}

export default AiGenerateTextAction;
