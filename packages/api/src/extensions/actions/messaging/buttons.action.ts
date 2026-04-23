/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { buttonSchema, ButtonType } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ExecArgs } from '@/actions';
import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import {
  MessageAction,
  messageActionOutputSchema,
  MessageActionSettings,
  messageActionSettingsSchema,
} from './message-action.base';

const buttonsInputSchema = z.object({
  text: z
    .string()
    .min(1)
    .default('Click on one of the following buttons')
    .meta({
      title: 'Text',
      description: 'The text message to be sent.',
    }),
  buttons: z
    .array(buttonSchema)
    .min(1, 'Provide at least one button')
    .default([
      { type: ButtonType.postback, payload: 'about', title: 'About' },
      { type: ButtonType.web_url, url: 'https://hexabot.ai', title: 'Website' },
    ])
    .meta({
      title: 'Options',
      description: 'Buttons options.',
    }),
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
        description: 'Sends a text message with buttons to the subscriber.',
        inputSchema: buttonsInputSchema,
        outputSchema: messageActionOutputSchema,
        settingsSchema: buttonsSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
    settings,
  }: ExecArgs<ButtonsInput, ConversationalWorkflowContext, ButtonsSettings>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildButtonsEnvelope(
      input.text,
      input.buttons,
    );

    return this.sendPreparedMessage(context, prepared, envelope, settings);
  }
}

export default SendButtonsAction;
