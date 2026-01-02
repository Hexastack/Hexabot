/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs, Settings } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import {
  outgoingMessageFormatSchema,
  stdIncomingMessageSchema,
  stdOutgoingMessageEnvelopeSchema,
} from '@/chat/types/message';
import { ConversationalWorkflowContext } from '@/workflow/services/conversational-workflow-context';

export const awaitReplyInputSchema = z.object({
  action: z.string().optional(),
  channel: z.string().optional(),
  recipient: z.string().optional(),
  workflowRunId: z.string().optional(),
  messageId: z.string().optional(),
  format: outgoingMessageFormatSchema.optional(),
  envelope: stdOutgoingMessageEnvelopeSchema.optional(),
});

export const awaitReplyResumeSchema = z.object({
  message: stdIncomingMessageSchema,
});

type AwaitReplyInput = z.infer<typeof awaitReplyInputSchema>;
type AwaitReplyOutput = z.infer<typeof stdIncomingMessageSchema>;
type AwaitReplySettings = Settings;

@Injectable()
export class AwaitReplyAction extends BaseAction<
  AwaitReplyInput,
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
        inputSchema: awaitReplyInputSchema,
        outputSchema: stdIncomingMessageSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<
    AwaitReplyInput,
    ConversationalWorkflowContext,
    AwaitReplySettings
  >) {
    const event = context.event;
    const enrichedInput: AwaitReplyInput = {
      action: input.action ?? 'await_reply',
      channel: input.channel ?? event?.getHandler().getName(),
      recipient:
        input.recipient ??
        context.subscriberId ??
        event?.getInitiator()?.id ??
        undefined,
      workflowRunId: input.workflowRunId ?? context.workflowRunId,
      messageId: input.messageId,
      format: input.format ?? input.envelope?.format,
      envelope: input.envelope,
    };
    const resumeData = await context.workflow.suspend<
      z.infer<typeof awaitReplyResumeSchema>
    >({
      reason: 'awaiting_user_response',
      data: enrichedInput,
    });
    const parsed = awaitReplyResumeSchema.safeParse(resumeData);

    if (!parsed.success) {
      throw new Error('resumeData must include a message payload');
    }

    return parsed.data.message;
  }
}

export default AwaitReplyAction;
