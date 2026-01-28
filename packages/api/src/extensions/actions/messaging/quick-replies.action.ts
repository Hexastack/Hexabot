/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { QuickReplyType, stdQuickReplySchema } from '@/chat/types/quick-reply';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import {
  MessageAction,
  MessageActionSettings,
  messageActionOutputSchema,
  messageActionSettingsSchema,
} from './message-action.base';

const quickRepliesInputSchema = z.object({
  text: z.string().min(1).default('Choose an option').meta({
    title: 'Text',
    description: 'The text message to be sent.',
  }),
  quick_replies: z
    .array(stdQuickReplySchema)
    .min(1, 'Provide at least one quick reply')
    .default([
      { content_type: QuickReplyType.text, payload: 'yes', title: 'Yes' },
      { content_type: QuickReplyType.text, payload: 'no', title: 'No' },
    ])
    .meta({
      title: 'Options',
      description: 'Quick replies options.',
    }),
});

type QuickRepliesInput = z.infer<typeof quickRepliesInputSchema>;
type QuickRepliesSettings = MessageActionSettings;

const quickRepliesSettingsSchema = messageActionSettingsSchema;

@Injectable()
export class SendQuickRepliesAction extends MessageAction<
  QuickRepliesInput,
  QuickRepliesSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_quick_replies',
        description:
          'Sends a text message with quick replies to the subscriber and optionally waits for the reply.',
        inputSchema: quickRepliesInputSchema,
        outputSchema: messageActionOutputSchema,
        settingsSchema: quickRepliesSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<
    QuickRepliesInput,
    ConversationalWorkflowContext,
    QuickRepliesSettings
  >) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildQuickRepliesEnvelope(
      input.text,
      input.quick_replies,
    );

    return this.sendPreparedMessage(context, prepared, envelope, settings);
  }
}

export default SendQuickRepliesAction;
