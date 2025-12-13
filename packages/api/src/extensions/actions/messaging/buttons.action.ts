/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { buttonSchema } from '@/chat/types/button';
import { stdIncomingMessageSchema } from '@/chat/types/message';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { MessageAction } from './message-action.base';

const buttonsInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]),
  buttons: z.array(buttonSchema).min(1, 'Provide at least one button'),
  options: z.record(z.any()).optional(),
});

type ButtonsInput = z.infer<typeof buttonsInputSchema>;

@Injectable()
export class SendButtonsAction extends MessageAction<ButtonsInput> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_buttons',
        description:
          'Sends a text message with buttons to the subscriber and waits for the reply.',
        inputSchema: buttonsInputSchema,
        outputSchema: stdIncomingMessageSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<ButtonsInput, WorkflowContext>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildButtonsEnvelope(
      input.text,
      input.buttons,
    );

    return this.sendPreparedAndSuspend(
      context,
      prepared,
      envelope,
      input.options,
    );
  }
}

export default SendButtonsAction;
