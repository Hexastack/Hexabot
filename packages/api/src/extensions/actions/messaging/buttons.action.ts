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

import {
  MessageAction,
  MessageActionSettings,
  messageActionSettingsSchema,
} from './message-action.base';

const buttonsInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]),
  buttons: z.array(buttonSchema).min(1, 'Provide at least one button'),
});

type ButtonsInput = z.infer<typeof buttonsInputSchema>;
type ButtonsSettings = MessageActionSettings;

const buttonsSettingsSchema = messageActionSettingsSchema;

@Injectable()
export class SendButtonsAction extends MessageAction<
  ButtonsInput,
  ButtonsSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_buttons',
        description:
          'Sends a text message with buttons to the subscriber and optionally waits for the reply.',
        inputSchema: buttonsInputSchema,
        outputSchema: stdIncomingMessageSchema,
        settingsSchema: buttonsSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<ButtonsInput, WorkflowContext, ButtonsSettings>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildButtonsEnvelope(
      input.text,
      input.buttons,
    );

    return this.sendPreparedAndHandleReply(
      context,
      prepared,
      envelope,
      settings,
    );
  }
}

export default SendButtonsAction;
