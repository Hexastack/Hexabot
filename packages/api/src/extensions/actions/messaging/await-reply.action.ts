/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Settings } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ExecArgs } from '@/actions';
import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';
import { conversationalWorkflowInputZodSchema } from '@/workflow/schemas/workflow-input-schemas';
import { WorkflowType } from '@/workflow/types';

export const awaitReplyResumeSchema =
  conversationalWorkflowInputZodSchema.clone();

type AwaitReplyOutput = z.infer<typeof awaitReplyResumeSchema>;
type AwaitReplySettings = Settings;

@Injectable()
export class AwaitReplyAction extends BaseAction<
  void,
  AwaitReplyOutput,
  ConversationalWorkflowContext,
  AwaitReplySettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'await_reply',
        description:
          'Suspends the workflow until a subscriber reply is received, returning the incoming message on resume.',
        workflowTypes: [WorkflowType.conversational],
        outputSchema: awaitReplyResumeSchema,
        icon: 'Hourglass',
        color: '#040606',
        group: 'messaging',
      },
      actionService,
    );
  }

  async execute({
    context,
  }: ExecArgs<void, ConversationalWorkflowContext, AwaitReplySettings>) {
    const resumeData = await context.workflow.suspend<
      z.infer<typeof awaitReplyResumeSchema>
    >({
      reason: 'awaiting_user_response',
      data: null,
    });
    const parsed = awaitReplyResumeSchema.safeParse(resumeData);

    if (!parsed.success) {
      throw new Error(
        'resumeData must be compliant with the workflow input schema (conversational)',
      );
    }

    return parsed.data;
  }
}

export default AwaitReplyAction;
