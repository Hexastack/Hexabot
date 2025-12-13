/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { stdIncomingMessageSchema } from '@/chat/types/message';
import { stdQuickReplySchema } from '@/chat/types/quick-reply';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { MessageAction } from './message-action.base';

const quickRepliesInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]),
  quick_replies: z
    .array(stdQuickReplySchema)
    .min(1, 'Provide at least one quick reply'),
  options: z.record(z.any()).optional(),
});

type QuickRepliesInput = z.infer<typeof quickRepliesInputSchema>;

@Injectable()
export class SendQuickRepliesAction extends MessageAction<QuickRepliesInput> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_quick_replies',
        description:
          'Sends a text message with quick replies to the subscriber and waits for the reply.',
        inputSchema: quickRepliesInputSchema,
        outputSchema: stdIncomingMessageSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<QuickRepliesInput, WorkflowContext>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildQuickRepliesEnvelope(
      input.text,
      input.quick_replies,
    );

    return this.sendPreparedAndSuspend(
      context,
      prepared,
      envelope,
      input.options,
    );
  }
}

export default SendQuickRepliesAction;
