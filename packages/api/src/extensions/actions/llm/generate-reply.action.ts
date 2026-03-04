/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';
import { WorkflowType } from '@/workflow/types';

import { AiPromptInput } from './ai-base.action';
import {
  AiGenerateReplyInput,
  aiGenerateReplyInputSchema,
  aiGenerateReplyOutputSchema,
  aiGenerateReplySettingsSchema,
} from './ai-schemas';
import { AiGenerateTextBaseAction } from './generate-text.base.action';

@Injectable()
export class AiGenerateReplyAction extends AiGenerateTextBaseAction<
  AiGenerateReplyInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'ai_generate_reply',
        description:
          'Generates a reply from either a direct prompt or recent conversation history using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.conversational],
        inputSchema: aiGenerateReplyInputSchema,
        outputSchema: aiGenerateReplyOutputSchema,
        settingsSchema: aiGenerateReplySettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: AiGenerateReplyInput): AiPromptInput {
    return input;
  }
}

export default AiGenerateReplyAction;
