/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { attachmentPayloadSchema } from '@/chat/types/attachment';
import { stdQuickReplySchema } from '@/chat/types/quick-reply';
import { ConversationalWorkflowContext } from '@/workflow/services/conversational-workflow-context';

import {
  MessageAction,
  MessageActionSettings,
  messageActionOutputSchema,
  messageActionSettingsSchema,
} from '../messaging/message-action.base';

const attachmentInputSchema = z.object({
  attachment: attachmentPayloadSchema,
  quick_replies: z.array(stdQuickReplySchema).optional(),
});

type AttachmentInput = z.infer<typeof attachmentInputSchema>;
type AttachmentSettings = MessageActionSettings;

const attachmentSettingsSchema = messageActionSettingsSchema;

@Injectable()
export class SendAttachmentAction extends MessageAction<
  AttachmentInput,
  AttachmentSettings
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_attachment',
        description:
          'Sends an attachment message to the subscriber and optionally waits for the reply.',
        inputSchema: attachmentInputSchema,
        outputSchema: messageActionOutputSchema,
        settingsSchema: attachmentSettingsSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<
    AttachmentInput,
    ConversationalWorkflowContext,
    AttachmentSettings
  >) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildAttachmentEnvelope(
      input.attachment,
      input.quick_replies ?? [],
    );

    return this.sendPreparedMessage(context, prepared, envelope, settings);
  }
}

export default SendAttachmentAction;
