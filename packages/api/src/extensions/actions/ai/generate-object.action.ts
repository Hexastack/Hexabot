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
  AiGenerateObjectInput,
  aiGenerateObjectInputSchema,
  aiGenerateObjectOutputSchema,
  aiGenerateObjectSettingsSchema,
} from './ai-schemas';
import { AiGenerateObjectBaseAction } from './generate-object.base.action';

@Injectable()
export class AiGenerateObjectAction extends AiGenerateObjectBaseAction<
  AiGenerateObjectInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'ai_generate_object',
        description:
          'Generates stateless structured output from a direct prompt using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.manual, WorkflowType.scheduled],
        inputSchema: aiGenerateObjectInputSchema,
        outputSchema: aiGenerateObjectOutputSchema,
        settingsSchema: aiGenerateObjectSettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: AiGenerateObjectInput): AiPromptInput {
    return {
      input_mode: 'prompt',
      prompt: input.prompt,
      system: input.system,
    };
  }
}

export default AiGenerateObjectAction;
