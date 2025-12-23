/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import {
  MessageAction,
  MessageActionSettings,
  messageActionOutputSchema,
  messageActionSettingsSchema,
} from './message-action.base';

const textMessageInputSchema = z.object({
  text: z.union([z.string(), z.array(z.string())]),
});

type TextMessageInput = z.infer<typeof textMessageInputSchema>;
type TextMessageSettings = MessageActionSettings;

const textMessageSettingsSchema = messageActionSettingsSchema;

@Injectable()
export class SendTextMessageAction extends MessageAction<
  TextMessageInput,
  TextMessageSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_text_message',
        description:
          'Sends a text message to the subscriber and optionally waits for the reply.',
        inputSchema: textMessageInputSchema,
        outputSchema: messageActionOutputSchema,
        settingsSchema: textMessageSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<
    TextMessageInput,
    WorkflowContext,
    TextMessageSettings
  >) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildTextEnvelope(input.text);

    return this.sendPreparedMessage(context, prepared, envelope, settings);
  }
}

export default SendTextMessageAction;
