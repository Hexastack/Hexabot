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
  AiInferObjectInput,
  aiInferObjectInputSchema,
  aiInferObjectOutputSchema,
  aiInferObjectSettingsSchema,
} from './ai-schemas';
import { AiGenerateObjectBaseAction } from './generate-object.base.action';

@Injectable()
export class AiInferObjectAction extends AiGenerateObjectBaseAction<
  AiInferObjectInput,
  WorkflowRuntimeContext
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'ai_infer_object',
        description:
          'Generates structured output from a direct prompt or recent conversation history using a language model via the Vercel AI SDK.',
        workflowTypes: [WorkflowType.conversational],
        inputSchema: aiInferObjectInputSchema,
        outputSchema: aiInferObjectOutputSchema,
        settingsSchema: aiInferObjectSettingsSchema,
      },
      actionService,
    );
  }

  protected resolvePromptInput(input: AiInferObjectInput): AiPromptInput {
    return input;
  }
}

export default AiInferObjectAction;
