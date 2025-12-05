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
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { MessageAction } from './message-action.base';

const textMessageInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]),
  options: z.record(z.any()).optional(),
});

type TextMessageInput = z.infer<typeof textMessageInputSchema>;

@Injectable()
export class SendTextMessageAction extends MessageAction<TextMessageInput> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_text_message',
        description:
          'Sends a text message to the subscriber and waits for the reply.',
        inputSchema: textMessageInputSchema,
        outputSchema: stdIncomingMessageSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<TextMessageInput, WorkflowContext>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildTextEnvelope(input.text);

    return this.sendPreparedAndSuspend(
      context,
      prepared,
      envelope,
      input.options,
    );
  }
}

export default SendTextMessageAction;
